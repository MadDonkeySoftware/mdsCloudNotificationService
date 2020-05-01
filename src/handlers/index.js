const express = require('express');

const globals = require('../globals');

const router = express.Router();

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

router.post('/emit/:topic', emitHandler);

module.exports = router;
