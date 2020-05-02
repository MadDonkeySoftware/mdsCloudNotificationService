const bodyParser = require('body-parser');
const express = require('express');

const handlers = require('./handlers');

const buildApp = () => {
  const app = express();

  const contentTypeStandardizer = (req, res, next) => {
    const contentType = req.headers['content-type'];
    const isJson = /application\/.*\+json/;
    if (isJson.test(contentType)) {
      req.headers['content-type'] = 'application/json';
    }
    next();
  };

  const commonResponseSetup = (req, res, next) => {
    res.setHeader('content-type', 'application/json');
    next();
  };

  const configureRoutes = (expressApp) => {
    expressApp.get('/', (req, res) => {
      // TODO: Need to create help documentation and publish it here.
      res.send('{"msg":"Hello World!"}');
    });

    expressApp.use('/', handlers);
  };

  app.use(commonResponseSetup);
  app.use(contentTypeStandardizer);
  app.use(bodyParser.json());
  app.use(bodyParser.text());
  configureRoutes(app);

  return app;
};

module.exports = {
  buildApp,
};
