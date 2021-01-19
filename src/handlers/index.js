const express = require('express');
const urlJoin = require('url-join');
const axios = require('axios');
const memoryCache = require('memory-cache');
const jwt = require('jsonwebtoken');

const globals = require('../globals');
const helpers = require('../helpers');
const handlerHelpers = require('./handler-helpers');

const router = express.Router();
const logger = globals.getLogger();

const emitHandler = (request, response) => {
  const { nrp } = globals.getPubSub();
  const { params, body } = request;
  const { topic } = params;

  const msg = {
    ts: new Date().toISOString(),
    topic,
    message: body,
  };

  nrp.emit(topic, msg);

  response.status(200);
  response.send();
};

const handleBasicAuth = (request, response, next) => {
  const { headers } = request;
  const { authorization, token } = headers;

  // Bypass if token exists
  if (token) return next();
  if (!authorization) {
    response.setHeader('content-type', 'text/plain');
    const message = 'Please include authentication token in header "token" or basic authorization in header "authorization"';
    return handlerHelpers.sendResponse(response, 403, message);
  }

  const encoded = authorization.split(' ')[1];
  const credentials = Buffer.from(encoded, 'base64').toString('utf-8');
  const [userId, password] = credentials.split(':');

  const inputOrid = handlerHelpers.getOridFromRequest(request, 'topic');
  const accountId = inputOrid.custom3;

  const cacheKey = `${accountId}|${userId}`;
  const cacheToken = memoryCache.get(cacheKey);

  if (cacheToken) {
    request.headers.token = cacheToken;
    return next();
  }

  const url = urlJoin(helpers.getEnvVar('MDS_IDENTITY_URL'), 'v1', 'authenticate');
  const body = {
    accountId,
    userId,
    password,
  };
  return axios.post(url, body)
    .then((resp) => {
      const newToken = resp.data.token;
      request.headers.token = newToken;
      const parsedToken = jwt.decode(newToken);
      const bufferMs = 5000; // 5 seconds
      const tokenExp = parsedToken.exp * 1000; // Convert to millisecond
      const exp = tokenExp - new Date().getTime() - bufferMs;
      memoryCache.put(cacheKey, resp.data.token, exp);
      return next();
    });
};

router.post('/emit/:topic',
  handlerHelpers.ensureRequestOrid(false, 'topic'),
  handleBasicAuth,
  handlerHelpers.validateToken(logger),
  handlerHelpers.canAccessResource({ oridKey: 'topic', logger }),
  emitHandler);

module.exports = router;
