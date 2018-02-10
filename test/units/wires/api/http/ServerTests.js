'use strict';

const path = require('path');

const assert = require('assertthat');

const Server = require('../../../../../lib/wires/api/http/Server');

suite('Server', () => {
  test('is a function.', async () => {
    assert.that(Server).is.ofType('function');
  });

  test('throws an exception if port is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Server({});
      /* eslint-enable no-new */
    }).is.throwing('Port is missing.');
  });

  test('throws an exception if keys are missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Server({ port: 3000 });
      /* eslint-enable no-new */
    }).is.throwing('Keys directory is missing.');
  });

  test('throws an exception if CORS origin is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Server({ port: 3000, keys: path.join(__dirname, '..', '..', '..', '..', 'keys') });
      /* eslint-enable no-new */
    }).is.throwing('CORS origin is missing.');
  });

  test('throws an exception if keys can not be loaded.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Server({ port: 3000, keys: __dirname, corsOrigin: '*' });
      /* eslint-enable no-new */
    }).is.throwing('Keys could not be loaded.');
  });
});
