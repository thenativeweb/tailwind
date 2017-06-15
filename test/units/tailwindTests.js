'use strict';

const path = require('path');

const assert = require('assertthat');

const tailwind = require('../../lib/tailwind');

suite('tailwind', () => {
  suiteSetup(() => {
    tailwind.destroyApp();
  });

  test('is an object.', done => {
    assert.that(tailwind).is.ofType('object');
    done();
  });

  suite('app', () => {
    test('is a function.', done => {
      assert.that(tailwind.app).is.ofType('function');
      done();
    });

    test('throws an exception if no app has been defined yet.', done => {
      assert.that(() => {
        tailwind.app();
      }).is.throwing();
      done();
    });

    test('returns the application once it has been defined.', done => {
      tailwind.createApp({
        keys: path.join(__dirname, '..', 'keys'),
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      const app = tailwind.app();

      assert.that(app).is.ofType('object');
      done();
    });

    test('returns the same application when called multiple times.', done => {
      tailwind.createApp({
        keys: path.join(__dirname, '..', 'keys'),
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      const firstApp = tailwind.app(),
            secondApp = tailwind.app();

      assert.that(firstApp).is.sameAs(secondApp);
      done();
    });

    test('returns a new application when createApp was called in between.', done => {
      tailwind.createApp({
        keys: path.join(__dirname, '..', 'keys'),
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      const firstApp = tailwind.app();

      tailwind.createApp({
        keys: path.join(__dirname, '..', 'keys'),
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      const secondApp = tailwind.app();

      assert.that(firstApp).is.not.sameAs(secondApp);
      done();
    });
  });

  suite('createApp', () => {
    test('is a function.', done => {
      assert.that(tailwind.createApp).is.ofType('function');
      done();
    });

    test('returns the application.', done => {
      const app = tailwind.createApp({
        keys: path.join(__dirname, '..', 'keys'),
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app).is.ofType('object');
      done();
    });
  });

  suite('destroyApp', () => {
    test('is a function.', done => {
      assert.that(tailwind.destroyApp).is.ofType('function');
      done();
    });

    test('destroy an existing application.', done => {
      tailwind.createApp({
        keys: path.join(__dirname, '..', 'keys'),
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });
      tailwind.destroyApp();
      assert.that(() => {
        tailwind.app();
      }).is.throwing();
      done();
    });
  });
});
