'use strict';

const express = require('express'),
      Limes = require('limes');

const getConfigurationJson = require('./getConfigurationJson'),
      getPing = require('./getPing'),
      postCommand = require('./postCommand'),
      postEvents = require('./postEvents'),
      postRead = require('./postRead');

const v1 = function (app, { readModel, writeModel }) {
  const api = express();

  const limes = new Limes({
    identityProviderName: app.identityProvider.name,
    certificate: app.identityProvider.certificate
  });

  const verifyTokenMiddlewareExpress = limes.verifyTokenMiddlewareExpress();

  api.get('/ping', getPing());
  api.get('/configuration.json', getConfigurationJson({ readModel, writeModel }));

  api.post('/command', verifyTokenMiddlewareExpress, postCommand(app, { writeModel }));
  api.post('/events', verifyTokenMiddlewareExpress, postEvents(app));
  api.post('/read/:modelType/:modelName', verifyTokenMiddlewareExpress, postRead(app, { readModel }));

  return api;
};

module.exports = v1;
