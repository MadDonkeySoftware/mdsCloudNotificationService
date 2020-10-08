const supertest = require('supertest');
const sinon = require('sinon');
const chai = require('chai');
const jwt = require('jsonwebtoken');

const globals = require('../globals');
const handlerHelpers = require('./handler-helpers');
const src = require('..');

describe('src/handlers/index', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('emit handler using orid', () => {
    it('without token', () => {
      // Arrange
      const emitStub = sinon.stub();
      const app = src.buildApp();
      sinon.stub(globals, 'getPubSub').returns({
        nrp: { emit: emitStub },
      });

      // Act / Assert
      return supertest(app)
        .post('/v1/emit/orid:1::::1001:ns:fooBar')
        .set('Content-Type', 'application/custom+json')
        .send({ from: 'test', data: 'BOO' })
        .expect('content-type', /text\/plain/)
        .expect(403)
        .then((resp) => {
          chai.expect(resp.text).to.eql('Please include authentication token in header "token"');
          chai.expect(emitStub.notCalled).to.eql(true, 'Expected emitStub to not be called but was called.');
        });
    });

    it('with token', () => {
      // Arrange
      const emitStub = sinon.stub();
      const app = src.buildApp();
      sinon.stub(globals, 'getPubSub').returns({
        nrp: { emit: emitStub },
      });
      sinon.stub(handlerHelpers, 'getIssuer').returns('testIssuer');
      sinon.stub(handlerHelpers, 'getAppPublicSignature').resolves('publicSignature');
      sinon.stub(jwt, 'verify').returns({
        payload: {
          iss: 'testIssuer',
          accountId: '1001',
        },
      });

      // Act / Assert
      return supertest(app)
        .post('/v1/emit/orid:1::::1001:ns:fooBar')
        .set('Content-Type', 'application/custom+json')
        .set('token', 'validToken')
        .send({ from: 'test', data: 'BOO' })
        .expect('content-type', /application\/json/)
        .expect(200)
        .then((resp) => {
          chai.expect(resp.text).to.eql('');
          const { args } = emitStub.firstCall;
          delete args[1].ts; // Provides no value for test
          chai.expect(args).to.eql([
            'orid:1::::1001:ns:fooBar',
            {
              message: {
                data: 'BOO',
                from: 'test',
              },
              topic: 'orid:1::::1001:ns:fooBar',
            },
          ]);
        });
    });
  });

  describe('emit handler using non-orid', () => {
    it('without token', () => {
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
        .expect('content-type', /text\/plain/)
        .expect(403)
        .then((resp) => {
          chai.expect(resp.text).to.eql('Please include authentication token in header "token"');
          chai.expect(emitStub.notCalled).to.eql(true, 'Expected emitStub to not be called but was called.');
        });
    });
  });
});
