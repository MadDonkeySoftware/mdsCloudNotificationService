const socketio = require('socket.io');
const globals = require('../globals');

const createPubSubEventHandler = (io) => (data, channel) => {
  io.emit(`${channel}`, data);
};

const wire = (server) => {
  const { nrp, emitter, receiver } = globals.getPubSub();
  const logger = globals.getLogger();

  if (!server) { throw new Error('server cannot be null/undefined.'); }
  const io = socketio(server);

  // Any event we get from redis we send out to our socket listeners
  const nrpHandler = createPubSubEventHandler(io);
  nrp.on('*', nrpHandler);

  const shutdownHandler = () => {
    io.close();
    nrp.quit();

    return Promise.all([
      emitter.quit().catch(() => {}),
      receiver.quit().catch(() => {}),
    ])
      .then(() => logger.trace('Promise all resolved'));
  };

  return shutdownHandler;
};

module.exports = {
  createPubSubEventHandler,
  wire,
};
