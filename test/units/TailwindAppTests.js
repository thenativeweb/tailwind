'use strict';

const path = require('path');

const assert = require('assertthat'),
      nodeenv = require('nodeenv');

const TailwindApp = require('../../lib/TailwindApp');

suite('TailwindApp', () => {
  test('is a function.', done => {
    assert.that(TailwindApp).is.ofType('function');
    done();
  });

  test('throws an exception if the identity provider name is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new TailwindApp({
      /* eslint-enable no-new */
        identityProvider: {
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });
    }).is.throwing('Identity provider name is missing.');
    done();
  });

  test('throws an exception if the identity provider certificate is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new TailwindApp({
      /* eslint-enable no-new */
        identityProvider: {
          name: 'auth.wolkenkit.io'
        }
      });
    }).is.throwing('Identity provider certificate is missing.');
    done();
  });

  suite('dirname', () => {
    test('is a string.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.dirname).is.ofType('string');
      done();
    });
  });

  suite('env', () => {
    test('is a function.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.env).is.ofType('function');
      done();
    });

    test('returns undefined for a non-existent environment variable.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.env('c585bb4a-4bf0-408a-a659-e45366179e06')).is.undefined();
      done();
    });

    test('returns a string for a string environment variable.', done => {
      nodeenv('9ecd11ee-527c-44df-b92b-366597a7ce68', 'foo', clear => {
        const app = new TailwindApp({
          identityProvider: {
            name: 'auth.wolkenkit.io',
            certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
          }
        });

        assert.that(app.env('9ecd11ee-527c-44df-b92b-366597a7ce68')).is.equalTo('foo');
        clear();
        done();
      });
    });

    test('returns a number for a number environment variable.', done => {
      nodeenv('dae10446-1ea6-4975-a609-38aadd03552e', 23, clear => {
        const app = new TailwindApp({
          identityProvider: {
            name: 'auth.wolkenkit.io',
            certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
          }
        });

        assert.that(app.env('dae10446-1ea6-4975-a609-38aadd03552e')).is.equalTo(23);
        clear();
        done();
      });
    });

    test('returns a boolean for a boolean environment variable.', done => {
      nodeenv('e2c9b8f0-0cde-41ab-ad30-e6d20673dbfc', true, clear => {
        const app = new TailwindApp({
          identityProvider: {
            name: 'auth.wolkenkit.io',
            certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
          }
        });

        assert.that(app.env('e2c9b8f0-0cde-41ab-ad30-e6d20673dbfc')).is.true();
        clear();
        done();
      });
    });

    test('returns an object for a valid JSON environment variable.', done => {
      nodeenv('73970898-df74-43c5-871e-0b21bd72abd9', '{ "foo" : "bar" }', clear => {
        const app = new TailwindApp({
          identityProvider: {
            name: 'auth.wolkenkit.io',
            certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
          }
        });

        assert.that(app.env('73970898-df74-43c5-871e-0b21bd72abd9')).is.equalTo({
          foo: 'bar'
        });
        clear();
        done();
      });
    });

    test('returns a string for an invalid JSON environment variable.', done => {
      nodeenv('e8ca044f-0184-450e-b64e-899d762c1330', '{ "foo" : "bar"', clear => {
        const app = new TailwindApp({
          identityProvider: {
            name: 'auth.wolkenkit.io',
            certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
          }
        });

        assert.that(app.env('e8ca044f-0184-450e-b64e-899d762c1330')).is.equalTo('{ "foo" : "bar"');
        clear();
        done();
      });
    });
  });

  suite('configuration', () => {
    test('is an object.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.configuration).is.ofType('object');
      done();
    });

    test('contains the package.json file.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.configuration.name).is.ofType('string');
      assert.that(app.configuration.version).is.ofType('string');
      assert.that(app.configuration.description).is.ofType('string');
      assert.that(app.configuration.dependencies).is.ofType('object');
      done();
    });
  });

  suite('name', () => {
    test('is a string.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.name).is.ofType('string');
      done();
    });

    test('equals app.configuration.name.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.name).is.equalTo(app.configuration.name);
      done();
    });
  });

  suite('version', () => {
    test('is a string.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.version).is.ofType('string');
      done();
    });

    test('equals app.configuration.version.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.version).is.equalTo(app.configuration.version);
      done();
    });
  });

  suite('data', () => {
    test('is a datasette.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.data).is.ofType('object');
      assert.that(app.data.get).is.ofType('function');
      assert.that(app.data.set).is.ofType('function');
      done();
    });
  });

  suite('services', () => {
    test('is an object.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.services).is.ofType('object');
      done();
    });

    test('has all services.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.services.bus).is.not.undefined();
      assert.that(app.services.crypto).is.not.undefined();
      assert.that(app.services.emitter).is.not.undefined();
      assert.that(app.services.getLogger).is.not.undefined();
      assert.that(app.services.stethoskop).is.not.undefined();
      assert.that(app.services.Timer).is.not.undefined();
      done();
    });
  });

  suite('identityProvider', () => {
    test('is an object.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.identityProvider).is.ofType('object');
      done();
    });

    test('has a name and a certificate.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.identityProvider.name).is.equalTo('auth.wolkenkit.io');
      assert.that(app.identityProvider.certificate.indexOf('Certificate:')).is.equalTo(0);
      done();
    });

    test('throws an exception when its certificate points to a non-existing file.', done => {
      assert.that(() => {
        /* eslint-disable no-new */
        new TailwindApp({
        /* eslint-enable no-new */
          identityProvider: {
            name: 'auth.wolkenkit.io',
            certificate: path.join(__dirname, '..', 'keys', 'non-existent-certificate.pem')
          }
        });
      }).is.throwing();
      done();
    });
  });

  suite('Command', () => {
    test('is a function.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.Command).is.ofType('function');
      done();
    });
  });

  suite('Event', () => {
    test('is a function.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.Event).is.ofType('function');
      done();
    });
  });

  suite('api', () => {
    test('is an object.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.api).is.ofType('object');
      done();
    });

    test('is an I/O Port.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.api.incoming).is.not.undefined();
      assert.that(app.api.outgoing).is.not.undefined();
      assert.that(app.api.use).is.not.undefined();
      done();
    });
  });

  suite('commandbus', () => {
    test('is an object.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.commandbus).is.ofType('object');
      done();
    });

    test('is an I/O Port.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.commandbus.incoming).is.not.undefined();
      assert.that(app.commandbus.outgoing).is.not.undefined();
      assert.that(app.commandbus.use).is.not.undefined();
      done();
    });
  });

  suite('eventbus', () => {
    test('is an object.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.eventbus).is.ofType('object');
      done();
    });

    test('is an I/O Port.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.eventbus.incoming).is.not.undefined();
      assert.that(app.eventbus.outgoing).is.not.undefined();
      assert.that(app.eventbus.use).is.not.undefined();
      done();
    });
  });

  suite('flowbus', () => {
    test('is an object.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.flowbus).is.ofType('object');
      done();
    });

    test('is an I/O Port.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.flowbus.incoming).is.not.undefined();
      assert.that(app.flowbus.outgoing).is.not.undefined();
      assert.that(app.flowbus.use).is.not.undefined();
      done();
    });
  });

  suite('run', () => {
    test('is a function.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.run).is.ofType('function');
      done();
    });

    test('runs the given function.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      app.run(() => {
        done();
      });
    });

    test('runs multiple functions.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      let wasFirstFunctionRun = false;

      app.run([
        callback => {
          wasFirstFunctionRun = true;
          callback(null);
        },
        () => {
          assert.that(wasFirstFunctionRun).is.true();
          done();
        }
      ]);
    });
  });

  suite('fail', () => {
    test('is a function.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.fail).is.ofType('function');
      done();
    });
  });

  suite('exit', () => {
    test('is a function.', done => {
      const app = new TailwindApp({
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', 'keys', 'certificate.pem')
        }
      });

      assert.that(app.exit).is.ofType('function');
      done();
    });
  });
});
