const _ = require('lodash');
const express = require('express');

const { pubSub } = require('../globals');

const { nrp } = pubSub;

const router = express.Router();


router.post('/emit/:topic', (request, response) => {
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
});

module.exports = router;
