/* eslint-disable no-unused-expressions */
const sinon = require('sinon');
const chai = require('chai');
const proxyquire = require('proxyquire');

const globals = require('../globals');
const pubSub = require('./pub-sub');

describe('pub-sub', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('wire', () => {
    it('creates on event handler and returns shutdown function', () => {
      // Arrange
      const nrpOnStub = sinon.stub();
      sinon.stub(globals, 'getPubSub').returns({
        nrp: { on: nrpOnStub },
      });

      // Act
      const localPubSub = proxyquire('./pub-sub', {
        'socket.io': sinon.stub(),
      });
      const shutdownCallback = localPubSub.wire(sinon.stub());

      // Assert
      const nrpOnCalls = nrpOnStub.getCalls();
      chai.expect(nrpOnCalls.length).to.equal(1);
      chai.expect(typeof shutdownCallback).to.be.equal('function');
    });

    it('throws error when provided application falsy', () => {
      // Arrange
      const nrpOnStub = sinon.stub();
      sinon.stub(globals, 'getPubSub').returns({
        nrp: { on: nrpOnStub },
      });

      // Act / Assert
      const localPubSub = proxyquire('./pub-sub', {
        'socket.io': sinon.stub(),
      });
      chai.expect(localPubSub.wire).to.throw();
    });

    it('returned shutdown handler closes all applicable streams', () => {
      // Arrange
      const ioStub = { close: sinon.stub() };
      const pubSubStub = {
        nrp: {
          on: sinon.stub(),
          quit: sinon.stub(),
        },
        emitter: {
          quit: sinon.stub().resolves(),
        },
        receiver: {
          quit: sinon.stub().resolves(),
        },
      };
      sinon.stub(globals, 'getPubSub').returns(pubSubStub);

      const localPubSub = proxyquire('./pub-sub', {
        'socket.io': () => ioStub,
      });
      const shutdownCallback = localPubSub.wire(sinon.stub());

      // Act
      return shutdownCallback().then(() => {
        // Assert
        chai.expect(ioStub.close.callCount).to.eql(1);
        chai.expect(pubSubStub.nrp.quit.callCount).to.eql(1);
        chai.expect(pubSubStub.emitter.quit.callCount).to.eql(1);
        chai.expect(pubSubStub.receiver.quit.callCount).to.eql(1);
      });
    });

    it('returned shutdown handler does not fail when emitter / receiver quit fails', () => {
      // Arrange
      const ioStub = { close: sinon.stub() };
      const pubSubStub = {
        nrp: {
          on: sinon.stub(),
          quit: sinon.stub(),
        },
        emitter: {
          quit: sinon.stub().rejects(),
        },
        receiver: {
          quit: sinon.stub().rejects(),
        },
      };
      sinon.stub(globals, 'getPubSub').returns(pubSubStub);

      const localPubSub = proxyquire('./pub-sub', {
        'socket.io': () => ioStub,
      });
      const shutdownCallback = localPubSub.wire(sinon.stub());

      // Act
      return shutdownCallback().then(() => {
        // Assert
        chai.expect(ioStub.close.callCount).to.eql(1);
        chai.expect(pubSubStub.nrp.quit.callCount).to.eql(1);
        chai.expect(pubSubStub.emitter.quit.callCount).to.eql(1);
        chai.expect(pubSubStub.receiver.quit.callCount).to.eql(1);
      });
    });
  });

  describe('createPubSubEventHandler', () => {
    it('calls io emit with data properly', () => {
      // Arrange
      const ioStub = { emit: sinon.stub() };
      const handler = pubSub.createPubSubEventHandler(ioStub);

      // Act
      handler({ foo: 1, bar: 2 }, 'test-channel');

      // Assert
      chai.expect(ioStub.emit.firstCall.args).to.eql(['test-channel', { foo: 1, bar: 2 }]);
    });
  });
});
