'use strict';

const path = require('path');

const assert = require('assertthat');

const Server = require('../../../../../lib/wires/api/http/Server');

suite('Server', () => {
  test('is a function.', done => {
    assert.that(Server).is.ofType('function');
    done();
  });

  test('throws an exception if options are missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Server();
      /* eslint-enable no-new */
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an exception if keys are missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Server({});
      /* eslint-enable no-new */
    }).is.throwing('Keys directory is missing.');
    done();
  });

  test('throws an exception if CORS origin is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Server({ keys: path.join(__dirname, '..', '..', '..', '..', 'keys') });
      /* eslint-enable no-new */
    }).is.throwing('CORS origin is missing.');
    done();
  });

  test('throws an exception if keys can not be loaded.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Server({ keys: __dirname, corsOrigin: '*' });
      /* eslint-enable no-new */
    }).is.throwing('Keys could not be loaded.');
    done();
  });
});
