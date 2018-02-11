'use strict';

const path = require('path');

const tailwind = require('../../../../../lib/tailwind');

const startApp = async function ({ port, corsOrigin }) {
  const app = tailwind.createApp({
    identityProvider: {
      name: 'auth.wolkenkit.io',
      certificate: path.join(__dirname, '..', '..', '..', '..', 'keys', 'certificate.pem')
    }
  });

  await app.api.use(new app.wires.api.http.Server({
    keys: path.join(__dirname, '..', '..', '..', '..', 'keys'),
    clientRegistry: 'wolkenkit',
    host: 'sample.wolkenkit.io',
    port,
    corsOrigin,
    writeModel: {
      network: {
        node: {
          commands: { ping: {}},
          events: { pinged: {}}
        }
      }
    },
    readModel: {
      lists: { pings: {}}
    }
  }));

  return app;
};

module.exports = startApp;
