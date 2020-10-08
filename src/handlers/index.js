const express = require('express');

const globals = require('../globals');
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

router.post('/emit/:topic',
  handlerHelpers.validateToken(logger),
  handlerHelpers.ensureRequestOrid(false, 'topic'),
  handlerHelpers.canAccessResource({ oridKey: 'topic', logger }),
  emitHandler);

module.exports = router;
