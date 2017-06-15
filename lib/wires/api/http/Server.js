'use strict';

const fs = require('fs'),
      path = require('path');

const _ = require('lodash'),
      bodyParser = require('body-parser'),
      cors = require('cors'),
      express = require('express'),
      flaschenpost = require('flaschenpost'),
      lusca = require('lusca'),
      morgan = require('morgan'),
      nocache = require('nocache'),
      spdy = require('spdy');

const v1 = require('./v1'),
      wsServer = require('./wsServer');

const Server = function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.keys) {
    throw new Error('Keys directory is missing.');
  }
  if (!options.corsOrigin) {
    throw new Error('CORS origin is missing.');
  }

  if (options.corsOrigin !== '*') {
    options.corsOrigin = _.flatten([ options.corsOrigin ]);
  }

  const { readModel, writeModel } = options;

  let certificate,
      privateKey;

  try {
    /* eslint-disable no-sync */
    privateKey = fs.readFileSync(path.join(options.keys, 'privateKey.pem'), { encoding: 'utf8' });
    certificate = fs.readFileSync(path.join(options.keys, 'certificate.pem'), { encoding: 'utf8' });
    /* eslint-enable no-sync */
  } catch (ex) {
    throw new Error('Keys could not be loaded.');
  }

  this.link = function (app, incoming, outgoing, callback) {
    if (!app) {
      throw new Error('App is missing.');
    }
    if (!incoming) {
      throw new Error('Incoming is missing.');
    }
    if (!outgoing) {
      throw new Error('Outgoing is missing.');
    }
    if (!callback) {
      throw new Error('Callback is missing.');
    }

    const logger = app.services.getLogger();

    const api = express();

    api.use(morgan('tiny', {
      stream: new flaschenpost.Middleware('debug')
    }));

    api.use(lusca.xframe('DENY'));
    api.use(lusca.xssProtection());

    api.options('*', cors({
      methods: 'GET,POST',
      origin: options.corsOrigin,
      optionsSuccessStatus: 200
    }));
    api.use(cors({
      methods: 'GET,POST',
      origin: options.corsOrigin,
      optionsSuccessStatus: 200
    }));

    api.use(nocache());
    api.use(bodyParser.json({ limit: '100kb' }));

    api.use('/v1', v1(app, options));

    const server = spdy.createServer({ key: privateKey, cert: certificate }, api);

    wsServer({ httpServer: server, app, readModel, writeModel });

    server.listen(options.port, () => {
      logger.debug('Started API endpoint.', options);
      callback(null);
    });
  };
};

module.exports = Server;
