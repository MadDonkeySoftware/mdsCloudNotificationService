const socketio = require('socket.io');
const { logger, pubSub } = require('../globals');

const { nrp, emitter, receiver } = pubSub;

module.exports.wire = (server) => {
  if (!server) { throw new Error('server cannot be null/undefined.'); }
  const io = socketio(server);

  // Any event we get from redis we send out to our socket listeners
  nrp.on('*', (data, channel) => {
    io.emit(`${channel}`, data);
  });

  const shutdownHandler = () => {
    io.close();
    nrp.quit();

    return Promise.all([
      emitter.quit().catch(() => {}),
      receiver.quit().catch(() => {}),
    ])
      .then(() => logger.info('Promise all resolved'));
  };

  return shutdownHandler;
};
