'use strict';

const fs = require('fs'),
      path = require('path');

const bodyParser = require('body-parser'),
      cors = require('cors'),
      express = require('express'),
      flaschenpost = require('flaschenpost'),
      flatten = require('lodash/flatten'),
      lusca = require('lusca'),
      morgan = require('morgan'),
      nocache = require('nocache'),
      spdy = require('spdy');

const v1 = require('./v1'),
      wsServer = require('./wsServer');

class Server {
  constructor ({ port, keys, corsOrigin, readModel, writeModel }) {
    if (!port) {
      throw new Error('Port is missing.');
    }
    if (!keys) {
      throw new Error('Keys directory is missing.');
    }
    if (!corsOrigin) {
      throw new Error('CORS origin is missing.');
    }

    if (corsOrigin === '*') {
      this.corsOrigin = corsOrigin;
    } else {
      this.corsOrigin = flatten([ corsOrigin ]);
    }

    try {
      /* eslint-disable no-sync */
      this.privateKey = fs.readFileSync(path.join(keys, 'privateKey.pem'), { encoding: 'utf8' });
      this.certificate = fs.readFileSync(path.join(keys, 'certificate.pem'), { encoding: 'utf8' });
      /* eslint-enable no-sync */
    } catch (ex) {
      throw new Error('Keys could not be loaded.');
    }

    this.port = port;
    this.readModel = readModel;
    this.writeModel = writeModel;
  }

  async link (app, incoming, outgoing) {
    if (!app) {
      throw new Error('App is missing.');
    }
    if (!incoming) {
      throw new Error('Incoming is missing.');
    }
    if (!outgoing) {
      throw new Error('Outgoing is missing.');
    }

    const { readModel, writeModel, privateKey, certificate, port } = this;

    const logger = app.services.getLogger();

    const api = express();

    api.use(morgan('tiny', {
      stream: new flaschenpost.Middleware('debug')
    }));

    api.use(lusca.xframe('DENY'));
    api.use(lusca.xssProtection());

    api.options('*', cors({
      methods: 'GET,POST',
      origin: this.corsOrigin,
      optionsSuccessStatus: 200
    }));
    api.use(cors({
      methods: 'GET,POST',
      origin: this.corsOrigin,
      optionsSuccessStatus: 200
    }));

    api.use(nocache());
    api.use(bodyParser.json({ limit: '100kb' }));

    api.use('/v1', v1(app, { readModel, writeModel }));

    const server = spdy.createServer({ key: privateKey, cert: certificate }, api);

    wsServer({ httpServer: server, app, readModel, writeModel });

    await new Promise(resolve => {
      server.listen(port, () => {
        logger.debug('Started API endpoint.', { port });
        resolve();
      });
    });
  }
}

module.exports = Server;
