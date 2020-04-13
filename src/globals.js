const Redis = require('ioredis');
const parseRedisUrl = require('parse-redis-url')();
const NRP = require('node-redis-pubsub');
const bunyan = require('bunyan');
const BunyanLogstashHttp = require('./bunyan-logstash-http');

/**
 * returns the current logger for the application
 */
const loggerMetadata = { fromLocal: process.env.DEBUG };
const logger = bunyan.createLogger({
  name: 'faasNotificationService',
  level: bunyan.TRACE,
  serializers: bunyan.stdSerializers,
  streams: [
    {
      stream: process.stdout,
    },
    {
      stream: new BunyanLogstashHttp({
        loggingEndpoint: process.env.MDS_LOG_URL,
        level: 'debug',
        metadata: loggerMetadata,
      }),
    },
  ],
});

/**
 * Node Redis PubSub things.
 */
const redisConnDetails = parseRedisUrl.parse(process.env.REDIS_URL);
const emitter = new Redis(redisConnDetails.port, redisConnDetails.host);
const receiver = new Redis(redisConnDetails.port, redisConnDetails.host);
const nrp = new NRP({ emitter, receiver });
const pubSub = { nrp, emitter, receiver };

/**
 * Promise wrapper around process.nextTick
 */
const nextTick = () => new Promise((resolve) => process.nextTick(resolve));

const delay = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

module.exports = {
  pubSub,
  logger,
  nextTick,
  delay,
};
