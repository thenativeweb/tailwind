'use strict';

const assert = require('assertthat');

const wsServer = require('../../../../../lib/wires/api/http/wsServer');

suite('wsServer', () => {
  test('is a function.', done => {
    assert.that(wsServer).is.ofType('function');
    done();
  });

  test('throws an exception if options are missing.', done => {
    assert.that(() => {
      wsServer();
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an exception if app is missing.', done => {
    assert.that(() => {
      wsServer({});
    }).is.throwing('App is missing.');
    done();
  });

  test('throws an exception if HTTP server is missing.', done => {
    assert.that(() => {
      wsServer({ app: {}});
    }).is.throwing('Http server is missing.');
    done();
  });

  test('throws an exception if read model is missing.', done => {
    assert.that(() => {
      wsServer({ app: {}, httpServer: {}});
    }).is.throwing('Read model is missing.');
    done();
  });

  test('throws an exception if write model is missing.', done => {
    assert.that(() => {
      wsServer({ app: {}, httpServer: {}, readModel: {}});
    }).is.throwing('Write model is missing.');
    done();
  });
});
