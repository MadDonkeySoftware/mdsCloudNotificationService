/* eslint-disable no-unused-expressions */
const sinon = require('sinon');
const chai = require('chai');
const proxyquire = require('proxyquire');

const globals = require('./globals');

describe('globals', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getLogger', () => {
    it('Returns a logger', () => {
      // Act
      const logger = globals.getLogger();

      // Assert
      chai.expect(logger.debug).to.not.be.undefined;
      chai.expect(logger.error).to.not.be.undefined;
      chai.expect(logger.info).to.not.be.undefined;
      chai.expect(logger.trace).to.not.be.undefined;
      chai.expect(logger.warn).to.not.be.undefined;
    });
  });

  describe('buildLogStreams', () => {
    it('Includes bunyan logstash http stream when MDS_LOG_URL present', () => {
      // Arrange
      const beforeValueNodeEnv = process.env.NODE_ENV;
      const beforeValueMdsLogUrl = process.env.MDS_LOG_URL;

      process.env.MDS_LOG_URL = 'http://127.0.0.1:8080';
      process.env.NODE_ENV = undefined;

      try {
        // Act
        const streams = globals.buildLogStreams();

        // Assert
        chai.expect(streams.length).to.be.eql(2);
        chai.expect(streams[0].stream).to.eql(process.stdout);
        chai.expect(streams[1].stream).to.not.eql(process.stdout);
      } finally {
        // Cleanup
        process.env.MDS_LOG_URL = beforeValueMdsLogUrl;
        process.env.NODE_ENV = beforeValueNodeEnv;
      }
    });
  });

  describe('buildRedisIoConstructorOptions', () => {
    it('retryStrategy returns undefined when retry attempts exceeded.', () => {
      // Arrange
      const options = globals.buildRedisIoConstructorOptions(10);

      // Act
      const result = options.retryStrategy(11);

      // Assert
      chai.expect(result).to.be.undefined;
    });

    it('retryStrategy returns value when retry attempts not exceeded.', () => {
      // Arrange
      const options = globals.buildRedisIoConstructorOptions(10);

      // Act
      const result = options.retryStrategy(1);

      // Assert
      chai.expect(result).to.not.be.undefined;
    });
  });

  describe('getPubSub', () => {
    it('When in test mode it returns undefined', () => {
      // Act
      const pubSub = globals.getPubSub();

      // Assert
      chai.expect(pubSub).to.be.undefined;
    });

    it('When not in test mode it returns constructed object with nrp, emitter and receiver', () => {
      // Arrange
      const stubNrp = sinon.stub();
      const stubEmitter = sinon.stub();
      const stubReceiver = sinon.stub();
      const beforeNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = undefined;

      let times = 0;
      function fakeRedis() {
        times += 1;
        if (times === 1) { return stubEmitter; }
        if (times === 2) { return stubReceiver; }
        return undefined;
      }

      function fakeNrp() { return stubNrp; }

      // Act
      let pubSub;
      try {
        const g = proxyquire('./globals', {
          ioredis: fakeRedis,
          'node-redis-pubsub': fakeNrp,
        });
        pubSub = g.getPubSub();
      } finally {
        process.env.NODE_ENV = beforeNodeEnv;
      }

      // Assert
      chai.expect(pubSub.nrp).to.be.equal(stubNrp);
      chai.expect(pubSub.emitter).to.be.equal(stubEmitter);
      chai.expect(pubSub.receiver).to.be.equal(stubReceiver);
    });
  });

  describe('delay', () => {
    it('Delays for the provided duration', () => {
      // Arrange
      const start = new Date().getTime();
      const delay = 10;

      // Act
      return globals.delay(delay).then(() => {
        // Assert
        const done = new Date().getTime();
        const drift = done - start - delay;

        chai.expect(drift).to.be.lessThan(2);
      });
    });
  });
});
