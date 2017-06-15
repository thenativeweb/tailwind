'use strict';

const express = require('express'),
      Limes = require('limes');

const getConfigurationJson = require('./getConfigurationJson'),
      getPing = require('./getPing'),
      postCommand = require('./postCommand'),
      postEvents = require('./postEvents'),
      postRead = require('./postRead');

const v1 = function (app, options) {
  const api = express();

  const limes = new Limes({
    identityProviderName: app.identityProvider.name,
    certificate: app.identityProvider.certificate
  });

  const verifyTokenMiddlewareExpress = limes.verifyTokenMiddlewareExpress();

  api.get('/ping', getPing());
  api.get('/configuration.json', getConfigurationJson(options));

  api.post('/command', verifyTokenMiddlewareExpress, postCommand(app, options));
  api.post('/events', verifyTokenMiddlewareExpress, postEvents(app));
  api.post('/read/:modelType/:modelName', verifyTokenMiddlewareExpress, postRead(app, options));

  return api;
};

module.exports = v1;
