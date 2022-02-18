const _ = require('lodash');
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');

const globals = require('../globals');
const handlerHelpers = require('./handler-helpers');

/**
 * @param {socketio.Server} io the socket.io server
 */
const createPubSubEventHandler = (io) => (data, channel) => {
  io.emit(`${channel}`, data);
};

// https://socket.io/docs/v3/index.html
// https://socket.io/docs/v3/middlewares/#Sending-credentials
/**
 * @callback middlewareNext
 * @param {*} [err]
 * @returns {void}
 */

/**
 * @param {socketio.Socket} socket the socket
 * @param {middlewareNext} next the next func
 */
const socketIoAuthMiddleware = async (socket, next) => {
  const token = _.get(socket, ['handshake', 'auth', 'token']);
  if (token) {
    const publicSignature = await handlerHelpers.getAppPublicSignature();
    const parsedToken = jwt.verify(token, publicSignature, { complete: true });
    if (parsedToken && parsedToken.payload.iss === handlerHelpers.getIssuer()) {
      return next();
    }
  }
  return next(new Error('unauthorized'));
};

const wire = (server) => {
  const { nrp, emitter, receiver } = globals.getPubSub();
  const logger = globals.getLogger();

  if (!server) {
    throw new Error('server cannot be null/undefined.');
  }
  const io = socketio(server);

  io.use(socketIoAuthMiddleware);

  // Any event we get from redis we send out to our socket listeners
  const nrpHandler = createPubSubEventHandler(io);
  nrp.on('*', nrpHandler);

  const shutdownHandler = () => {
    io.close();
    nrp.quit();

    return Promise.all([
      emitter.quit().catch(() => {}),
      receiver.quit().catch(() => {}),
    ]).then(() => logger.trace('Promise all resolved'));
  };

  return shutdownHandler;
};

module.exports = {
  createPubSubEventHandler,
  socketIoAuthMiddleware,
  wire,
};
