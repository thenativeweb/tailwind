'use strict';

const tailwind = require('../../../../../lib/tailwind');

const startApp = async function ({ port, corsOrigin }) {
  const app = tailwind.createApp();

  await app.api.use(new app.wires.status.http.Server({ port, corsOrigin }));

  return app;
};

module.exports = startApp;
