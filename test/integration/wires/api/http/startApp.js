'use strict';

const path = require('path');

const tailwind = require('../../../../../lib/tailwind');

const startApp = async function ({ port, corsOrigin, serveStatic }) {
  const app = tailwind.createApp({
    identityProviders: [
      {
        issuer: 'https://auth.thenativeweb.io',
        certificate: path.join(__dirname, '..', '..', '..', '..', 'shared', 'keys', 'certificate.pem')
      }
    ]
  });

  await app.api.use(new app.wires.api.http.Server({
    keys: path.join(__dirname, '..', '..', '..', '..', 'shared', 'keys'),
    port,
    corsOrigin,
    serveStatic,
    writeModel: {
      network: {
        node: {
          commands: {
            ping: {
              schema: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: true
              }
            }
          },
          events: {
            pinged: {}
          }
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
