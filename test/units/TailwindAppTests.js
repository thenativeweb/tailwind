'use strict';

const path = require('path');

const assert = require('assertthat'),
      nodeenv = require('nodeenv');

const TailwindApp = require('../../src/TailwindApp');

suite('TailwindApp', () => {
  test('is a function.', async () => {
    assert.that(TailwindApp).is.ofType('function');
  });

  test('throws an exception if the identity provider name is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new TailwindApp({
        identityProvider: {
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('Identity provider name is missing.');
  });

  test('throws an exception if the identity provider certificate is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io'
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('Identity provider certificate is missing.');
  });

  suite('dirname', () => {
    test('is a string.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.dirname).is.ofType('string');
    });
  });

  suite('env', () => {
    test('is a function.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.env).is.ofType('function');
    });

    test('returns undefined for a non-existent environment variable.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.env('c585bb4a-4bf0-408a-a659-e45366179e06')).is.undefined();
    });

    test('returns a string for a string environment variable.', async () => {
      const restore = nodeenv('9ecd11ee-527c-44df-b92b-366597a7ce68', 'foo');

      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.env('9ecd11ee-527c-44df-b92b-366597a7ce68')).is.equalTo('foo');
      restore();
    });

    test('returns a number for a number environment variable.', async () => {
      const restore = nodeenv('dae10446-1ea6-4975-a609-38aadd03552e', 23);

      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.env('dae10446-1ea6-4975-a609-38aadd03552e')).is.equalTo(23);
      restore();
    });

    test('returns a boolean for a boolean environment variable.', async () => {
      const restore = nodeenv('e2c9b8f0-0cde-41ab-ad30-e6d20673dbfc', true);

      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.env('e2c9b8f0-0cde-41ab-ad30-e6d20673dbfc')).is.true();
      restore();
    });

    test('returns an object for a valid JSON environment variable.', async () => {
      const restore = nodeenv('73970898-df74-43c5-871e-0b21bd72abd9', '{ "foo" : "bar" }');

      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.env('73970898-df74-43c5-871e-0b21bd72abd9')).is.equalTo({
        foo: 'bar'
      });
      restore();
    });

    test('returns a string for an invalid JSON environment variable.', async () => {
      const restore = nodeenv('e8ca044f-0184-450e-b64e-899d762c1330', '{ "foo" : "bar"');

      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.env('e8ca044f-0184-450e-b64e-899d762c1330')).is.equalTo('{ "foo" : "bar"');
      restore();
    });
  });

  suite('configuration', () => {
    test('is an object.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.configuration).is.ofType('object');
    });

    test('contains the package.json file.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.configuration.name).is.ofType('string');
      assert.that(app.configuration.version).is.ofType('string');
      assert.that(app.configuration.description).is.ofType('string');
      assert.that(app.configuration.dependencies).is.ofType('object');
    });
  });

  suite('name', () => {
    test('is a string.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.name).is.ofType('string');
    });

    test('equals app.configuration.name.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.name).is.equalTo(app.configuration.name);
    });
  });

  suite('version', () => {
    test('is a string.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.version).is.ofType('string');
    });

    test('equals app.configuration.version.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.version).is.equalTo(app.configuration.version);
    });
  });

  suite('data', () => {
    test('is a datasette.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.data).is.ofType('object');
      assert.that(app.data.get).is.ofType('function');
      assert.that(app.data.set).is.ofType('function');
    });
  });

  suite('services', () => {
    test('is an object.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.services).is.ofType('object');
    });

    test('has all services.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.services.bus).is.not.undefined();
      assert.that(app.services.crypto).is.not.undefined();
      assert.that(app.services.Emitter).is.not.undefined();
      assert.that(app.services.getLogger).is.not.undefined();
      assert.that(app.services.stethoskop).is.not.undefined();
      assert.that(app.services.Timer).is.not.undefined();
    });
  });

  suite('identityProvider', () => {
    test('is an object.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.identityProvider).is.ofType('object');
    });

    test('has a name and a certificate.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.identityProvider.name).is.equalTo('auth.wolkenkit.io');
      assert.that(app.identityProvider.certificate.indexOf('Certificate:')).is.equalTo(0);
    });

    test('throws an exception when its certificate points to a non-existing file.', async () => {
      assert.that(() => {
        /* eslint-disable no-new */
        new TailwindApp({
          identityProvider: {
            name: 'auth.wolkenkit.io',
            certificate: path.join(__dirname, '..', 'shared', 'keys', 'non-existent-certificate.pem')
          }
        });
        /* eslint-enable no-new */
      }).is.throwing();
    });
  });

  suite('Command', () => {
    test('is a function.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.Command).is.ofType('function');
    });
  });

  suite('Event', () => {
    test('is a function.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.Event).is.ofType('function');
    });
  });

  suite('api', () => {
    test('is an object.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.api).is.ofType('object');
    });

    test('is an I/O Port.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.api.incoming).is.not.undefined();
      assert.that(app.api.outgoing).is.not.undefined();
      assert.that(app.api.use).is.not.undefined();
    });
  });

  suite('commandbus', () => {
    test('is an object.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.commandbus).is.ofType('object');
    });

    test('is an I/O Port.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.commandbus.incoming).is.not.undefined();
      assert.that(app.commandbus.outgoing).is.not.undefined();
      assert.that(app.commandbus.use).is.not.undefined();
    });
  });

  suite('eventbus', () => {
    test('is an object.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.eventbus).is.ofType('object');
    });

    test('is an I/O Port.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.eventbus.incoming).is.not.undefined();
      assert.that(app.eventbus.outgoing).is.not.undefined();
      assert.that(app.eventbus.use).is.not.undefined();
    });
  });

  suite('flowbus', () => {
    test('is an object.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.flowbus).is.ofType('object');
    });

    test('is an I/O Port.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.flowbus.incoming).is.not.undefined();
      assert.that(app.flowbus.outgoing).is.not.undefined();
      assert.that(app.flowbus.use).is.not.undefined();
    });
  });

  suite('status', () => {
    test('is an object.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.status).is.ofType('object');
    });

    test('is an I/O Port.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.status.incoming).is.not.undefined();
      assert.that(app.status.outgoing).is.not.undefined();
      assert.that(app.status.use).is.not.undefined();
    });
  });

  suite('fail', () => {
    test('is a function.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.fail).is.ofType('function');
    });
  });

  suite('exit', () => {
    test('is a function.', async () => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.exit).is.ofType('function');
    });
  });
});
