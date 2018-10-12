'use strict';

var express = require('express'),
    Limes = require('limes');

var getConfigurationJson = require('./getConfigurationJson'),
    getPing = require('./getPing'),
    postCommand = require('./postCommand'),
    postEvents = require('./postEvents'),
    postRead = require('./postRead');

var v1 = function v1(app, _ref) {
  var readModel = _ref.readModel,
      writeModel = _ref.writeModel;
  var api = express();
  var limes = new Limes({
    identityProviderName: app.identityProvider.name,
    certificate: app.identityProvider.certificate
  });
  var verifyTokenMiddlewareExpress = limes.verifyTokenMiddlewareExpress();
  api.get('/ping', getPing());
  api.get('/configuration.json', getConfigurationJson({
    readModel: readModel,
    writeModel: writeModel
  }));
  api.post('/command', verifyTokenMiddlewareExpress, postCommand(app, {
    writeModel: writeModel
  }));
  api.post('/events', verifyTokenMiddlewareExpress, postEvents(app));
  api.post('/read/:modelType/:modelName', verifyTokenMiddlewareExpress, postRead(app, {
    readModel: readModel
  }));
  return api;
};

module.exports = v1;