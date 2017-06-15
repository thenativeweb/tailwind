'use strict';

const path = require('path'),
      stream = require('stream');

const assert = require('assertthat'),
      async = require('async'),
      jsonLinesClient = require('json-lines-client'),
      needle = require('needle'),
      uuid = require('uuidv4');

const buildEvent = require('../../../../helpers/buildEvent'),
      issueToken = require('../../../../helpers/issueToken'),
      tailwind = require('../../../../../lib/tailwind');

const PassThrough = stream.PassThrough;

const startApp = function (options, callback) {
  const app = tailwind.createApp({
    identityProvider: {
      name: 'auth.wolkenkit.io',
      certificate: path.join(__dirname, '..', '..', '..', '..', 'keys', 'certificate.pem')
    }
  });

  app.run([
    done => {
      app.api.use(new app.wires.api.http.Server({
        keys: path.join(__dirname, '..', '..', '..', '..', 'keys'),
        clientRegistry: 'wolkenkit',
        host: 'sample.wolkenkit.io',
        port: options.port,
        corsOrigin: options.corsOrigin,
        writeModel: {
          network: {
            node: {
              commands: {
                ping: {}
              },
              events: {
                pinged: {}
              }
            }
          }
        },
        readModel: {
          lists: {
            pings: {}
          }
        }
      }), done);
    },
    () => {
      callback(null, app);
    }
  ]);
};

suite('Server', () => {
  suite('routes', () => {
    let app;

    suiteSetup(done => {
      // Disable SSL certificate checks to allow running these tests with a
      // self-signed certificate.
      /* eslint-disable no-process-env */
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      /* eslint-enable no-process-env */

      startApp({ port: 3000, corsOrigin: '*' }, (err, startedApp) => {
        if (err) {
          return done(err);
        }

        app = startedApp;
        done(null);
      });
    });

    test('delivers the correct CORS headers.', done => {
      const corsOrigins = {
        3001: {
          origin: 'http://www.thenativeweb.io',
          allow: '*',
          expected: '*'
        },
        3002: {
          origin: 'http://www.thenativeweb.io',
          allow: 'http://www.thenativeweb.io',
          expected: 'http://www.thenativeweb.io'
        },
        3003: {
          origin: 'http://www.thenativeweb.io',
          allow: /\.thenativeweb\.io$/,
          expected: 'http://www.thenativeweb.io'
        },
        3004: {
          origin: 'http://www.example.com',
          allow: /\.thenativeweb\.io$/,
          expected: undefined
        },
        3005: {
          origin: 'http://www.thenativeweb.io',
          allow: [ 'http://www.thenativeweb.io', 'http://www.example.com' ],
          expected: 'http://www.thenativeweb.io'
        },
        3006: {
          origin: 'http://www.example.com',
          allow: 'http://www.thenativeweb.io',
          expected: undefined
        }
      };

      async.eachOf(corsOrigins, (corsOrigin, port, doneEach) => {
        startApp({ port, corsOrigin: corsOrigin.allow }, errStartApp => {
          assert.that(errStartApp).is.null();

          needle.request('options', `https://localhost:${port}/v1/ping`, undefined, {
            headers: {
              origin: corsOrigin.origin,
              'access-control-request-method': 'POST',
              'access-control-request-headers': 'X-Requested-With'
            }
          }, (err, res) => {
            assert.that(err).is.null();
            assert.that(res.headers['access-control-allow-origin']).is.equalTo(corsOrigin.expected);
            assert.that(res.headers['access-control-allow-methods']).is.equalTo('GET,POST');
            assert.that(res.statusCode).is.equalTo(200);
            doneEach(null);
          });
        });
      }, done);
    });

    suite('GET /v1/ping', () => {
      test('returns 200.', done => {
        needle.get('https://localhost:3000/v1/ping', (err, res) => {
          assert.that(err).is.null();
          assert.that(res.statusCode).is.equalTo(200);
          done();
        });
      });

      test('returns application/json.', done => {
        needle.get('https://localhost:3000/v1/ping', (err, res) => {
          assert.that(err).is.null();
          assert.that(res.headers['content-type']).is.equalTo('application/json; charset=utf-8');
          done();
        });
      });

      test('answers with api version v1.', done => {
        needle.get('https://localhost:3000/v1/ping', (err, res, body) => {
          assert.that(err).is.null();
          assert.that(body).is.equalTo({
            api: 'v1'
          });
          done();
        });
      });
    });

    suite('GET /v1/configuration.json', () => {
      test('returns 200.', done => {
        needle.get('https://localhost:3000/v1/configuration.json', (err, res) => {
          assert.that(err).is.null();
          assert.that(res.statusCode).is.equalTo(200);
          done();
        });
      });

      test('returns text/javascript.', done => {
        needle.get('https://localhost:3000/v1/configuration.json', (err, res) => {
          assert.that(err).is.null();
          assert.that(res.headers['content-type']).is.equalTo('application/json; charset=utf-8');
          done();
        });
      });

      test('serves the application configuration.', done => {
        needle.get('https://localhost:3000/v1/configuration.json', (err, res, body) => {
          assert.that(err).is.null();

          assert.that(body).is.ofType('object');
          assert.that(body.writeModel).is.equalTo({
            network: {
              node: {
                commands: {
                  ping: {}
                },
                events: {
                  pinged: {}
                }
              }
            }
          });
          assert.that(body.readModel).is.equalTo({
            lists: {
              pings: {}
            }
          });
          done();
        });
      });
    });

    suite('POST /v1/command', () => {
      test('returns 415 if the content-type header is missing.', done => {
        needle.post('https://localhost:3000/v1/command', 'foobar', (err, res, body) => {
          assert.that(err).is.null();
          assert.that(res.statusCode).is.equalTo(415);
          assert.that(body).is.equalTo('Header content-type must be application/json.');
          done();
        });
      });

      test('returns 415 if content-type is not set to application/json.', done => {
        needle.post('https://localhost:3000/v1/command', 'foobar', {
          headers: {
            'content-type': 'text/plain'
          },
          json: true
        }, (err, res, body) => {
          assert.that(err).is.null();
          assert.that(res.statusCode).is.equalTo(415);
          assert.that(body).is.equalTo('Header content-type must be application/json.');
          done();
        });
      });

      test('returns 400 if a malformed command is sent.', done => {
        needle.post('https://localhost:3000/v1/command', {
          foo: 'bar'
        }, {
          json: true
        }, (err, res, body) => {
          assert.that(err).is.null();
          assert.that(res.statusCode).is.equalTo(400);
          assert.that(body).is.equalTo('Malformed command.');
          done();
        });
      });

      test('returns 400 if a wellformed command is sent with a non-existent context name.', done => {
        const command = new app.Command({
          context: {
            name: 'foo'
          },
          aggregate: {
            name: 'node',
            id: 'dfa1c416-32e6-431a-8d65-27ba0fc3e978'
          },
          name: 'ping',
          data: {
            foo: 'foobar'
          }
        });

        needle.post('https://localhost:3000/v1/command', command, {
          json: true
        }, (err, res, body) => {
          assert.that(err).is.null();
          assert.that(res.statusCode).is.equalTo(400);
          assert.that(body).is.equalTo('Unknown context name.');
          done();
        });
      });

      test('returns 400 if a wellformed command is sent with a non-existent aggregate name.', done => {
        const command = new app.Command({
          context: {
            name: 'network'
          },
          aggregate: {
            name: 'foo',
            id: 'dfa1c416-32e6-431a-8d65-27ba0fc3e978'
          },
          name: 'ping',
          data: {
            foo: 'foobar'
          }
        });

        needle.post('https://localhost:3000/v1/command', command, {
          json: true
        }, (err, res, body) => {
          assert.that(err).is.null();
          assert.that(res.statusCode).is.equalTo(400);
          assert.that(body).is.equalTo('Unknown aggregate name.');
          done();
        });
      });

      test('returns 400 if a wellformed command is sent with a non-existent command name.', done => {
        const command = new app.Command({
          context: {
            name: 'network'
          },
          aggregate: {
            name: 'node',
            id: 'dfa1c416-32e6-431a-8d65-27ba0fc3e978'
          },
          name: 'foo',
          data: {
            foo: 'foobar'
          }
        });

        needle.post('https://localhost:3000/v1/command', command, {
          json: true
        }, (err, res, body) => {
          assert.that(err).is.null();
          assert.that(res.statusCode).is.equalTo(400);
          assert.that(body).is.equalTo('Unknown command name.');
          done();
        });
      });

      test('returns 200 if a wellformed command is sent and everything is fine.', done => {
        const command = new app.Command({
          context: {
            name: 'network'
          },
          aggregate: {
            name: 'node',
            id: 'dfa1c416-32e6-431a-8d65-27ba0fc3e978'
          },
          name: 'ping',
          data: {
            foo: 'foobar'
          }
        });

        let counter = 0;

        app.api.incoming.once('data', () => {
          counter += 1;
          if (counter === 2) {
            return done();
          }
        });

        needle.post('https://localhost:3000/v1/command', command, {
          json: true
        }, (err, res) => {
          assert.that(err).is.null();
          assert.that(res.statusCode).is.equalTo(200);
          counter += 1;
          if (counter === 2) {
            return done();
          }
        });
      });

      test('emits an incoming command to the app.api.incoming stream.', done => {
        const command = new app.Command({
          context: {
            name: 'network'
          },
          aggregate: {
            name: 'node',
            id: 'dfa1c416-32e6-431a-8d65-27ba0fc3e978'
          },
          name: 'ping',
          data: {
            foo: 'foobar'
          }
        });

        app.api.incoming.once('data', actual => {
          assert.that(actual.context.name).is.equalTo(command.context.name);
          assert.that(actual.aggregate.name).is.equalTo(command.aggregate.name);
          assert.that(actual.aggregate.id).is.equalTo(command.aggregate.id);
          assert.that(actual.name).is.equalTo(command.name);
          assert.that(actual.data).is.equalTo(command.data);
          assert.that(actual.user.id).is.equalTo('anonymous');
          assert.that(actual.user.token.sub).is.equalTo('anonymous');
          assert.that(actual.user.token.iss).is.equalTo('auth.wolkenkit.io');
          done();
        });

        needle.post('https://localhost:3000/v1/command', command, {
          json: true
        });
      });
    });

    suite('POST /v1/events', () => {
      test('receives an event from the app.api.outgoing stream.', done => {
        const joinedEvent = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
          participant: 'Jane Doe'
        });

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/events'
        }, server => {
          server.stream.once('data', event => {
            assert.that(event.data).is.equalTo({
              participant: 'Jane Doe'
            });

            server.disconnect();
            done();
          });
        });

        setTimeout(() => {
          app.api.outgoing.write(joinedEvent);
        }, 0.5 * 1000);
      });

      test('receives multiple events from the app.api.outgoing stream.', done => {
        const joinedEvent1 = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
          participant: 'Jane Doe'
        });
        const joinedEvent2 = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
          participant: 'John Doe'
        });

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/events'
        }, server => {
          server.stream.once('data', event => {
            server.stream.once('data', event2 => {
              assert.that(event2.data).is.equalTo({
                participant: 'John Doe'
              });

              server.disconnect();
              done();
            });

            assert.that(event.data).is.equalTo({
              participant: 'Jane Doe'
            });
          });
        });

        setTimeout(() => {
          app.api.outgoing.write(joinedEvent1);
          setTimeout(() => {
            app.api.outgoing.write(joinedEvent2);
          }, 0.5 * 1000);
        }, 0.5 * 1000);
      });

      test('receives filtered events from the app.api.outgoing stream.', done => {
        const startedEvent = buildEvent('planning', 'peerGroup', uuid(), 'started', {
          participant: 'Jane Doe'
        });
        const joinedEvent = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
          participant: 'John Doe'
        });

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/events',
          body: {
            name: 'joined'
          }
        }, server => {
          server.stream.once('data', event => {
            assert.that(event.data).is.equalTo({
              participant: 'John Doe'
            });

            server.disconnect();
            done();
          });
        });

        setTimeout(() => {
          app.api.outgoing.write(startedEvent);
          setTimeout(() => {
            app.api.outgoing.write(joinedEvent);
          }, 0.5 * 1000);
        }, 0.5 * 1000);
      });

      suite('filters events based on authorization options', () => {
        test('sends public events to public users.', done => {
          const eventForPublic = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'John Doe'
          });

          eventForPublic.metadata.isAuthorized = {
            owner: uuid(),
            forAuthenticated: true,
            forPublic: true
          };

          jsonLinesClient({
            protocol: 'https',
            host: 'localhost',
            port: 3000,
            path: '/v1/events'
          }, server => {
            server.stream.once('data', event => {
              assert.that(event.data).is.equalTo({
                participant: 'John Doe'
              });

              server.disconnect();
              done();
            });
          });

          setTimeout(() => {
            app.api.outgoing.write(eventForPublic);
          }, 0.5 * 1000);
        });

        test('sends public events to authenticated users.', done => {
          const eventForPublic = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'John Doe'
          });

          eventForPublic.metadata.isAuthorized = {
            owner: uuid(),
            forAuthenticated: true,
            forPublic: true
          };

          jsonLinesClient({
            protocol: 'https',
            host: 'localhost',
            port: 3000,
            path: '/v1/events',
            headers: {
              authorization: `Bearer ${issueToken('Jane Doe')}`
            }
          }, server => {
            server.stream.once('data', event => {
              assert.that(event.data).is.equalTo({
                participant: 'John Doe'
              });

              server.disconnect();
              done();
            });
          });

          setTimeout(() => {
            app.api.outgoing.write(eventForPublic);
          }, 0.5 * 1000);
        });

        test('sends public events to owners.', done => {
          const ownerId = uuid();

          const eventForPublic = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'John Doe'
          });

          eventForPublic.metadata.isAuthorized = {
            owner: ownerId,
            forAuthenticated: true,
            forPublic: true
          };

          jsonLinesClient({
            protocol: 'https',
            host: 'localhost',
            port: 3000,
            path: '/v1/events',
            headers: {
              authorization: `Bearer ${issueToken(ownerId)}`
            }
          }, server => {
            server.stream.once('data', event => {
              assert.that(event.data).is.equalTo({
                participant: 'John Doe'
              });

              server.disconnect();
              done();
            });
          });

          setTimeout(() => {
            app.api.outgoing.write(eventForPublic);
          }, 0.5 * 1000);
        });

        test('does not send authenticated events to public users.', done => {
          const eventForAuthenticated = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'Jane Doe'
          });

          eventForAuthenticated.metadata.isAuthorized = {
            owner: uuid(),
            forAuthenticated: true,
            forPublic: false
          };

          const eventForPublic = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'John Doe'
          });

          eventForPublic.metadata.isAuthorized = {
            owner: uuid(),
            forAuthenticated: true,
            forPublic: true
          };

          jsonLinesClient({
            protocol: 'https',
            host: 'localhost',
            port: 3000,
            path: '/v1/events'
          }, server => {
            server.stream.once('data', event => {
              assert.that(event.data).is.equalTo({
                participant: 'John Doe'
              });

              server.disconnect();
              done();
            });
          });

          setTimeout(() => {
            app.api.outgoing.write(eventForAuthenticated);

            setTimeout(() => {
              app.api.outgoing.write(eventForPublic);
            }, 0.5 * 1000);
          }, 0.5 * 1000);
        });

        test('sends authenticated events to authenticated users.', done => {
          const eventForAuthenticated = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'Jane Doe'
          });

          eventForAuthenticated.metadata.isAuthorized = {
            owner: uuid(),
            forAuthenticated: true,
            forPublic: false
          };

          jsonLinesClient({
            protocol: 'https',
            host: 'localhost',
            port: 3000,
            path: '/v1/events',
            headers: {
              authorization: `Bearer ${issueToken('Jane Doe')}`
            }
          }, server => {
            server.stream.once('data', event => {
              assert.that(event.data).is.equalTo({
                participant: 'Jane Doe'
              });

              server.disconnect();
              done();
            });
          });

          setTimeout(() => {
            app.api.outgoing.write(eventForAuthenticated);
          }, 0.5 * 1000);
        });

        test('sends authenticated events to owners.', done => {
          const ownerId = uuid();

          const eventForAuthenticated = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'Jane Doe'
          });

          eventForAuthenticated.metadata.isAuthorized = {
            owner: ownerId,
            forAuthenticated: true,
            forPublic: false
          };

          jsonLinesClient({
            protocol: 'https',
            host: 'localhost',
            port: 3000,
            path: '/v1/events',
            headers: {
              authorization: `Bearer ${issueToken(ownerId)}`
            }
          }, server => {
            server.stream.once('data', event => {
              assert.that(event.data).is.equalTo({
                participant: 'Jane Doe'
              });

              server.disconnect();
              done();
            });
          });

          setTimeout(() => {
            app.api.outgoing.write(eventForAuthenticated);
          }, 0.5 * 1000);
        });

        test('does not send owner events to public users.', done => {
          const ownerId = uuid();

          const eventForOwner = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'Jane Doe'
          });

          eventForOwner.metadata.isAuthorized = {
            owner: ownerId,
            forAuthenticated: false,
            forPublic: false
          };

          const eventForPublic = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'John Doe'
          });

          eventForPublic.metadata.isAuthorized = {
            owner: uuid(),
            forAuthenticated: true,
            forPublic: true
          };

          jsonLinesClient({
            protocol: 'https',
            host: 'localhost',
            port: 3000,
            path: '/v1/events'
          }, server => {
            server.stream.once('data', event => {
              assert.that(event.data).is.equalTo({
                participant: 'John Doe'
              });

              server.disconnect();
              done();
            });
          });

          setTimeout(() => {
            app.api.outgoing.write(eventForOwner);

            setTimeout(() => {
              app.api.outgoing.write(eventForPublic);
            }, 0.5 * 1000);
          }, 0.5 * 1000);
        });

        test('does not send owner events to authenticated users.', done => {
          const ownerId = uuid();

          const eventForOwner = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'Jane Doe'
          });

          eventForOwner.metadata.isAuthorized = {
            owner: ownerId,
            forAuthenticated: false,
            forPublic: false
          };

          const eventForPublic = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'John Doe'
          });

          eventForPublic.metadata.isAuthorized = {
            owner: uuid(),
            forAuthenticated: true,
            forPublic: true
          };

          jsonLinesClient({
            protocol: 'https',
            host: 'localhost',
            port: 3000,
            path: '/v1/events',
            headers: {
              authorization: `Bearer ${issueToken('Jane Doe')}`
            }
          }, server => {
            server.stream.once('data', event => {
              assert.that(event.data).is.equalTo({
                participant: 'John Doe'
              });

              server.disconnect();
              done();
            });
          });

          setTimeout(() => {
            app.api.outgoing.write(eventForOwner);

            setTimeout(() => {
              app.api.outgoing.write(eventForPublic);
            }, 0.5 * 1000);
          }, 0.5 * 1000);
        });

        test('sends owner events to owners.', done => {
          const ownerId = uuid();

          const eventForOwner = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'Jane Doe'
          });

          eventForOwner.metadata.isAuthorized = {
            owner: ownerId,
            forAuthenticated: false,
            forPublic: false
          };

          jsonLinesClient({
            protocol: 'https',
            host: 'localhost',
            port: 3000,
            path: '/v1/events',
            headers: {
              authorization: `Bearer ${issueToken(ownerId)}`
            }
          }, server => {
            server.stream.once('data', event => {
              assert.that(event.data).is.equalTo({
                participant: 'Jane Doe'
              });

              server.disconnect();
              done();
            });
          });

          setTimeout(() => {
            app.api.outgoing.write(eventForOwner);
          }, 0.5 * 1000);
        });
      });
    });

    suite('POST /v1/read/:modelType/:modelName?where=...&orderBy=...&skip=...&take=...', () => {
      test('returns 404 when no model type is given.', done => {
        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read'
        }, server => {
          server.stream.once('error', err => {
            assert.that(err).is.not.null();
            assert.that(err.name).is.equalTo('UnexpectedStatusCode');
            done();
          });
        });
      });

      test('returns 404 when no model name is given.', done => {
        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/Lists'
        }, server => {
          server.stream.once('error', err => {
            assert.that(err).is.not.null();
            assert.that(err.name).is.equalTo('UnexpectedStatusCode');
            done();
          });
        });
      });

      test('returns 400 when specifying a non-existent model type.', done => {
        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/non-existent/foo'
        }, server => {
          server.stream.once('error', err => {
            assert.that(err).is.not.null();
            assert.that(err.name).is.equalTo('UnexpectedStatusCode');
            assert.that(err.message).is.equalTo('Unknown model type.');
            done();
          });
        });
      });

      test('returns 400 when specifying a non-existent model name.', done => {
        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/foo'
        }, server => {
          server.stream.once('error', err => {
            assert.that(err).is.not.null();
            assert.that(err.name).is.equalTo('UnexpectedStatusCode');
            assert.that(err.message).is.equalTo('Unknown model name.');
            done();
          });
        });
      });

      test('passes the given model type and model name to the app.api.read function.', done => {
        app.api.read = function (modelType, modelName, options, callback) {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          /* eslint-disable callback-return */
          callback(null, fakeStream);
          /* eslint-enable callback-return */

          assert.that(modelType).is.equalTo('lists');
          assert.that(modelName).is.equalTo('pings');
          done();
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings'
        }, server => {
          server.stream.resume();
        });
      });

      test('passes the given where to the app.api.read function.', done => {
        app.api.read = function (modelType, modelName, options, callback) {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          /* eslint-disable callback-return */
          callback(null, fakeStream);
          /* eslint-enable callback-return */

          assert.that(options.where).is.equalTo({
            $and: [
              { lastName: 'Doe' },
              { $or: [
                { 'isAuthorized.owner': 'anonymous' },
                { 'isAuthorized.forPublic': true }
              ]}
            ]
          });
          done();
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings',
          query: {
            where: JSON.stringify({ lastName: 'Doe' })
          }
        }, server => {
          server.stream.resume();
        });
      });

      test('attaches the authenticated user to the where clause.', done => {
        const ownerId = uuid();

        app.api.read = function (modelType, modelName, options, callback) {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          /* eslint-disable callback-return */
          callback(null, fakeStream);
          /* eslint-enable callback-return */

          assert.that(options.where).is.equalTo({
            $and: [
              { lastName: 'Doe' },
              { $or: [
                { 'isAuthorized.owner': ownerId },
                { 'isAuthorized.forPublic': true },
                { 'isAuthorized.forAuthenticated': true }
              ]}
            ]
          });
          done();
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings',
          query: {
            where: JSON.stringify({ lastName: 'Doe' })
          },
          headers: {
            authorization: `Bearer ${issueToken(ownerId)}`
          }
        }, server => {
          server.stream.resume();
        });
      });

      test('falls back to an empty where if where is missing.', done => {
        app.api.read = function (modelType, modelName, options, callback) {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          /* eslint-disable callback-return */
          callback(null, fakeStream);
          /* eslint-enable callback-return */

          assert.that(options.where).is.equalTo({
            $and: [
              {},
              { $or: [
                { 'isAuthorized.owner': 'anonymous' },
                { 'isAuthorized.forPublic': true }
              ]}
            ]
          });
          done();
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings'
        }, server => {
          server.stream.resume();
        });
      });

      test('passes the given order by to the app.api.read function.', done => {
        app.api.read = function (modelType, modelName, options, callback) {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          /* eslint-disable callback-return */
          callback(null, fakeStream);
          /* eslint-enable callback-return */

          assert.that(options.orderBy).is.equalTo({ lastName: 'ascending' });
          done();
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings',
          query: {
            orderBy: JSON.stringify({ lastName: 'ascending' })
          }
        }, server => {
          server.stream.resume();
        });
      });

      test('falls back to an empty order by if order by is missing.', done => {
        app.api.read = function (modelType, modelName, options, callback) {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          /* eslint-disable callback-return */
          callback(null, fakeStream);
          /* eslint-enable callback-return */

          assert.that(options.orderBy).is.equalTo({});
          done();
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings'
        }, server => {
          server.stream.resume();
        });
      });

      test('passes the given skip to the app.api.read function.', done => {
        app.api.read = function (modelType, modelName, options, callback) {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          /* eslint-disable callback-return */
          callback(null, fakeStream);
          /* eslint-enable callback-return */

          assert.that(options.skip).is.equalTo(23);
          done();
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings',
          query: {
            skip: 23
          }
        }, server => {
          server.stream.resume();
        });
      });

      test('falls back to skip=0 if skip is missing.', done => {
        app.api.read = function (modelType, modelName, options, callback) {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          /* eslint-disable callback-return */
          callback(null, fakeStream);
          /* eslint-enable callback-return */

          assert.that(options.skip).is.equalTo(0);
          done();
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings'
        }, server => {
          server.stream.resume();
        });
      });

      test('falls back to skip=0 if skip is invalid.', done => {
        app.api.read = function (modelType, modelName, options, callback) {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          /* eslint-disable callback-return */
          callback(null, fakeStream);
          /* eslint-enable callback-return */

          assert.that(options.skip).is.equalTo(0);
          done();
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings',
          query: {
            skip: 'abc'
          }
        }, server => {
          server.stream.resume();
        });
      });

      test('passes the given take to the app.api.read function.', done => {
        app.api.read = function (modelType, modelName, options, callback) {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          /* eslint-disable callback-return */
          callback(null, fakeStream);
          /* eslint-enable callback-return */

          assert.that(options.take).is.equalTo(23);
          done();
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings',
          query: {
            take: 23
          }
        }, server => {
          server.stream.resume();
        });
      });

      test('falls back to take=100 if take is missing.', done => {
        app.api.read = function (modelType, modelName, options, callback) {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          /* eslint-disable callback-return */
          callback(null, fakeStream);
          /* eslint-enable callback-return */

          assert.that(options.take).is.equalTo(100);
          done();
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings'
        }, server => {
          server.stream.resume();
        });
      });

      test('falls back to take=100 if take is invalid.', done => {
        app.api.read = function (modelType, modelName, options, callback) {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          /* eslint-disable callback-return */
          callback(null, fakeStream);
          /* eslint-enable callback-return */

          assert.that(options.take).is.equalTo(100);
          done();
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings',
          query: {
            take: 'abc'
          }
        }, server => {
          server.stream.resume();
        });
      });

      test('returns 400 when an invalid where is given.', done => {
        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings',
          query: {
            where: 'foo'
          }
        }, server => {
          server.stream.once('error', err => {
            assert.that(err).is.not.null();
            assert.that(err.name).is.equalTo('UnexpectedStatusCode');
            assert.that(err.message).is.equalTo('Invalid where.');
            done();
          });
        });
      });

      test('returns 400 when an invalid order by is given.', done => {
        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings',
          query: {
            orderBy: 'foo'
          }
        }, server => {
          server.stream.once('error', err => {
            assert.that(err).is.not.null();
            assert.that(err.name).is.equalTo('UnexpectedStatusCode');
            assert.that(err.message).is.equalTo('Invalid order by.');
            done();
          });
        });
      });

      test('returns 500 when read returns an error.', done => {
        app.api.read = function (modelType, modelName, options, callback) {
          return callback(new Error());
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings'
        }, server => {
          server.stream.once('error', err => {
            assert.that(err).is.not.null();
            assert.that(err.name).is.equalTo('UnexpectedStatusCode');
            assert.that(err.message).is.equalTo('Unable to load model.');
            done();
          });
        });
      });

      test('streams a single data item from the app.api.read function to the client.', done => {
        let fakeModelDataStream;

        app.api.read = function (modelType, modelName, options, callback) {
          fakeModelDataStream = new PassThrough({ objectMode: true });

          return callback(null, fakeModelDataStream);
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings'
        }, server => {
          server.stream.once('data', modelEvent => {
            assert.that(modelEvent).is.equalTo({ foo: 'bar' });
            done();
          });
        });

        setTimeout(() => {
          fakeModelDataStream.write({ foo: 'bar' });
          fakeModelDataStream.end();
        }, 0.5 * 1000);
      });

      test('returns multiple documents as JSON.', done => {
        let fakeModelDataStream;

        app.api.read = function (modelType, modelName, options, callback) {
          fakeModelDataStream = new PassThrough({ objectMode: true });

          return callback(null, fakeModelDataStream);
        };

        let counter = 0;

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings'
        }, server => {
          server.stream.on('data', modelEvent => {
            counter += 1;
            switch (counter) {
              case 1:
                assert.that(modelEvent).is.equalTo({ foo: 'bar' });
                break;
              case 2:
                assert.that(modelEvent).is.equalTo({ foo: 'baz' });

                return done();
              default:
                return done(new Error('Invalid operation.'));
            }
          });
        });

        setTimeout(() => {
          fakeModelDataStream.write({ foo: 'bar' });
          setTimeout(() => {
            fakeModelDataStream.write({ foo: 'baz' });
            fakeModelDataStream.end();
          }, 0.5 * 1000);
        }, 0.5 * 1000);
      });

      test('closes the stream when the client disconnects.', done => {
        let fakeModelDataStream;

        app.api.read = function (modelType, modelName, options, callback) {
          fakeModelDataStream = new PassThrough({ objectMode: true });
          fakeModelDataStream.write({ foo: 'bar' });

          return callback(null, fakeModelDataStream);
        };

        jsonLinesClient({
          protocol: 'https',
          host: 'localhost',
          port: 3000,
          path: '/v1/read/lists/pings'
        }, server => {
          setTimeout(() => {
            server.disconnect();
            setTimeout(() => {
              fakeModelDataStream.once('error', err => {
                assert.that(err.message).is.equalTo('write after end');
                done();
              }).write({ foo: 'bar' });
            }, 0.5 * 1000);
          }, 0.5 * 1000);
        });
      });
    });
  });
});
