'use strict';

const path = require('path');

const tailwind = require('../../../../../src/tailwind');

const startApp = async function ({ port, corsOrigin }) {
  const app = tailwind.createApp({
    identityProvider: {
      name: 'auth.wolkenkit.io',
      certificate: path.join(__dirname, '..', '..', '..', '..', 'shared', 'keys', 'certificate.pem')
    }
  });

  await app.api.use(new app.wires.status.http.Server({
    port,
    corsOrigin
  }));

  return app;
};

module.exports = startApp;
