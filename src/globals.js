const Redis = require('ioredis');
const parseRedisUrl = require('parse-redis-url')();
const NRP = require('node-redis-pubsub');
const bunyan = require('bunyan');
const bunyanLogstashHttp = require('./bunyan-logstash-http');

const buildLogStreams = () => {
  const loggerMetadata = { fromLocal: process.env.DEBUG };
  const logStreams = [];

  if (!/test/.test(process.env.NODE_ENV)) {
    logStreams.push({
      stream: process.stdout,
    });
  }

  if (process.env.MDS_LOG_URL) {
    logStreams.push(
      {
        stream: bunyanLogstashHttp.createLoggerStream({
          loggingEndpoint: process.env.MDS_LOG_URL,
          level: 'debug',
          metadata: loggerMetadata,
        }),
      },
    );
  }

  return logStreams;
};

const logger = bunyan.createLogger({
  name: 'yeoman test dir',
  level: bunyan.TRACE,
  serializers: bunyan.stdSerializers,
  streams: buildLogStreams(),
});

/**
 * returns the current logger for the application
 */
const getLogger = () => logger;


/**
 * Node Redis PubSub things.
 */
const buildRedisIoConstructorOptions = (maxRetries) => {
  const options = {
    retryStrategy: (times) => {
      const log = module.exports.getLogger();
      if (times < maxRetries) {
        const delay = Math.min(times * 100, 2000);
        const metadata = {
          delay,
          maxRetries,
          tries: times,
          url: process.env.REDIS_URL || '127.0.0.1:6379', // ioredis default
        };
        log.warn(metadata, 'A problem occurred while connecting. A delay will occur before reconnecting.');
        return delay;
      }

      log.warn({ maxRetries }, 'Max reconnect retries exceeded.');
      return undefined;
    },
  };
  return options;
};

const getPubSub = () => {
  if (process.env.NODE_ENV !== 'test') {
    const redisConnDetails = parseRedisUrl.parse(process.env.REDIS_URL);
    const options = module.exports.buildRedisIoConstructorOptions(10);
    const emitter = new Redis(redisConnDetails.port, redisConnDetails.host, options);
    const receiver = new Redis(redisConnDetails.port, redisConnDetails.host, options);

    const nrp = new NRP({ emitter, receiver });
    const pubSub = { nrp, emitter, receiver };

    return pubSub;
  }

  return undefined;
};

const delay = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

module.exports = {
  buildLogStreams,
  buildRedisIoConstructorOptions,
  getPubSub,
  getLogger,
  delay,
};
