const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');

const { logger } = require('./globals');
const handlers = require('./handlers');
const appShutdown = require('./handlers/app_shutdown');
const pubSub = require('./handlers/pub-sub');

const app = express();
const port = 8888;

// const requestLogger = (req, res, next) => {
//   logger.trace({ req }, `Handling ${req.path} - ${req.method}`);
//   next();
// };

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
    res.send('Hello World!');
  });

  expressApp.use('/', handlers);
};

// app.use(requestLogger);
app.use(commonResponseSetup);
app.use(contentTypeStandardizer);
app.use(bodyParser.json());
app.use(bodyParser.text());
configureRoutes(app);

const server = http.Server(app);
const pubSubShutdown = pubSub.wire(server);

appShutdown.wire(() => pubSubShutdown());

server.listen(port, () => logger.info(`Example app listening on port ${port}!`));
