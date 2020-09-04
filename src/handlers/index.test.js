const supertest = require('supertest');
const sinon = require('sinon');
const chai = require('chai');

const globals = require('../globals');
const src = require('..');

describe('src/handlers/index', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('provides the root url', () => {
    // Arrange
    const emitStub = sinon.stub();
    const app = src.buildApp();
    sinon.stub(globals, 'getPubSub').returns({
      nrp: { emit: emitStub },
    });

    // Act / Assert
    return supertest(app)
      .post('/v1/emit/orid:1::::1:ns:fooBar')
      .set('Content-Type', 'application/custom+json')
      .send({ from: 'test', data: 'BOO' })
      .expect('content-type', /application\/json/)
      .expect(200)
      .then((resp) => {
        chai.expect(resp.text).to.eql('');
        const { args } = emitStub.firstCall;
        delete args[1].ts; // Provides no value for test
        chai.expect(args).to.eql([
          'orid:1::::1:ns:fooBar',
          {
            message: {
              data: 'BOO',
              from: 'test',
            },
            topic: 'orid:1::::1:ns:fooBar',
          },
        ]);
      });
  });

  it('provides the root url', () => {
    // Arrange
    const emitStub = sinon.stub();
    const app = src.buildApp();
    sinon.stub(globals, 'getPubSub').returns({
      nrp: { emit: emitStub },
    });

    // Act / Assert
    return supertest(app)
      .post('/v1/emit/fooBar')
      .set('Content-Type', 'application/custom+json')
      .send({ from: 'test', data: 'BOO' })
      .expect('content-type', /application\/json/)
      .expect(400)
      .then((resp) => {
        chai.expect(resp.text).to.eql('');
        chai.expect(emitStub.notCalled).to.eql(true, 'Expected emitStub to not be called but was called.');
      });
  });
});
