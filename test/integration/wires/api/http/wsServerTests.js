'use strict';

const path = require('path'),
      stream = require('stream');

const assert = require('assertthat'),
      uuid = require('uuidv4'),
      WebSocket = require('ws');

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

suite('wsServer', () => {
  suite('routes', () => {
    let app,
        socket;

    suiteSetup(done => {
      // Disable SSL certificate checks to allow running these tests with a
      // self-signed certificate.
      /* eslint-disable no-process-env */
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      /* eslint-enable no-process-env */

      startApp({ port: 4000, corsOrigin: '*' }, (err, startedApp) => {
        if (err) {
          return done(err);
        }

        app = startedApp;
        done(null);
      });
    });

    setup(done => {
      socket = new WebSocket('wss://localhost:4000/');
      socket.once('open', () => {
        done();
      });
    });

    teardown(() => {
      socket.close();
    });

    suite('v1/sendCommand', () => {
      test('returns 400 if invalid JSON is sent.', done => {
        socket.once('message', message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Bad request.',
            statusCode: 400
          });
          done();
        });

        socket.send('invalid JSON');
      });

      test('returns 400 if version is missing.', done => {
        socket.once('message', message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Bad request.',
            statusCode: 400
          });
          done();
        });

        socket.send(JSON.stringify({}));
      });

      test('returns 400 if type is missing.', done => {
        socket.once('message', message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Bad request.',
            statusCode: 400
          });
          done();
        });

        socket.send(JSON.stringify({ version: 'v1', procedureId: uuid() }));
      });

      test('returns 400 if procedure id is missing.', done => {
        socket.once('message', message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Procedure id is missing.',
            statusCode: 400
          });
          done();
        });

        socket.send(JSON.stringify({ version: 'v1', type: 'sendCommand' }));
      });

      test('returns 400 if procedure id is not a uuid.', done => {
        socket.once('message', message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Procedure id is invalid.',
            statusCode: 400
          });
          done();
        });

        socket.send(JSON.stringify({ version: 'v1', type: 'sendCommand', procedureId: 'foo' }));
      });

      test('returns 400 if payload is missing.', done => {
        const procedureId = uuid();

        socket.once('message', message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Malformed command.',
            statusCode: 400,
            procedureId
          });
          done();
        });

        socket.send(JSON.stringify({ version: 'v1', type: 'sendCommand', procedureId }));
      });

      test('returns 400 if a malformed command is sent.', done => {
        const procedureId = uuid();

        socket.once('message', message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Malformed command.',
            statusCode: 400,
            procedureId
          });
          done();
        });

        socket.send(JSON.stringify({ version: 'v1', type: 'sendCommand', procedureId, payload: { foo: 'bar' }}));
      });

      test('returns 400 if a wellformed command is sent with a non-existent context name.', done => {
        const procedureId = uuid();

        const command = new app.Command({
          context: {
            name: 'Foo'
          },
          aggregate: {
            name: 'Node',
            id: 'dfa1c416-32e6-431a-8d65-27ba0fc3e978'
          },
          name: 'Ping',
          data: {
            foo: 'foobar'
          }
        });

        socket.once('message', message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Unknown context name.',
            statusCode: 400,
            procedureId
          });
          done();
        });

        socket.send(JSON.stringify({ version: 'v1', type: 'sendCommand', procedureId, payload: command }));
      });

      test('returns 400 if a wellformed command is sent with a non-existent aggregate name.', done => {
        const procedureId = uuid();

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

        socket.once('message', message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Unknown aggregate name.',
            statusCode: 400,
            procedureId
          });
          done();
        });

        socket.send(JSON.stringify({ version: 'v1', type: 'sendCommand', procedureId, payload: command }));
      });

      test('returns 400 if a wellformed command is sent with a non-existent command name.', done => {
        const procedureId = uuid();

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

        socket.once('message', message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Unknown command name.',
            statusCode: 400,
            procedureId
          });
          done();
        });

        socket.send(JSON.stringify({ version: 'v1', type: 'sendCommand', procedureId, payload: command }));
      });

      test('returns 200 if a wellformed command is sent and everything is fine.', done => {
        const procedureId = uuid();

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

        socket.once('message', message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'sentCommand',
            statusCode: 200,
            procedureId
          });

          counter += 1;
          if (counter === 2) {
            return done();
          }
        });

        socket.send(JSON.stringify({ version: 'v1', type: 'sendCommand', procedureId, payload: command }));
      });

      test('emits an incoming command to the app.api.incoming stream.', done => {
        const procedureId = uuid();

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

        socket.send(JSON.stringify({ version: 'v1', type: 'sendCommand', procedureId, payload: command }));
      });
    });

    suite('v1/subscribeEvents', () => {
      test('receives an event from the app.api.outgoing stream.', done => {
        const procedureId = uuid();
        const joinedEvent = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
          participant: 'Jane Doe'
        });
        let receivedMessages = 0;

        const onMessage = message => {
          receivedMessages += 1;

          switch (receivedMessages) {
            case 1:
              assert.that(JSON.parse(message)).is.equalTo({
                type: 'subscribedEvents',
                statusCode: 200,
                procedureId
              });

              app.api.outgoing.write(joinedEvent);
              break;
            case 2:
              assert.that(JSON.parse(message).payload.data).is.equalTo({ participant: 'Jane Doe' });

              socket.removeListener('message', onMessage);

              return done();
            default:
              throw new Error('Should never be called.');
          }
        };

        socket.on('message', onMessage);
        socket.send(JSON.stringify({ version: 'v1', type: 'subscribeEvents', procedureId }));
      });

      test('receives multiple events from the app.api.outgoing stream.', done => {
        const procedureId = uuid();
        const joinedEvent1 = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
          participant: 'Jane Doe'
        });
        const joinedEvent2 = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
          participant: 'John Doe'
        });
        let receivedMessages = 0;

        const onMessage = message => {
          receivedMessages += 1;

          switch (receivedMessages) {
            case 1:
              assert.that(JSON.parse(message)).is.equalTo({
                type: 'subscribedEvents',
                statusCode: 200,
                procedureId
              });
              app.api.outgoing.write(joinedEvent1);
              break;
            case 2:
              assert.that(JSON.parse(message).payload.data).is.equalTo({ participant: 'Jane Doe' });
              app.api.outgoing.write(joinedEvent2);
              break;
            case 3:
              assert.that(JSON.parse(message).payload.data).is.equalTo({ participant: 'John Doe' });

              socket.removeListener('message', onMessage);

              return done();

            default:
              throw new Error('Should never be called.');
          }
        };

        socket.on('message', onMessage);
        socket.send(JSON.stringify({ version: 'v1', type: 'subscribeEvents', procedureId }));
      });

      test('receives filtered events from the app.api.outgoing stream.', done => {
        const procedureId = uuid();
        const startedEvent = buildEvent('planning', 'peerGroup', uuid(), 'started', {
          participant: 'Jane Doe'
        });
        const joinedEvent = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
          participant: 'John Doe'
        });
        let receivedMessages = 0;

        const onMessage = message => {
          receivedMessages += 1;

          switch (receivedMessages) {
            case 1:
              assert.that(JSON.parse(message)).is.equalTo({
                type: 'subscribedEvents',
                statusCode: 200,
                procedureId
              });
              app.api.outgoing.write(startedEvent);
              app.api.outgoing.write(joinedEvent);
              break;
            case 2:
              assert.that(JSON.parse(message).payload.data).is.equalTo({ participant: 'John Doe' });
              socket.removeListener('message', onMessage);

              return done();
            default:
              throw new Error('Should never be called.');
          }
        };

        socket.on('message', onMessage);
        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeEvents',
          procedureId,
          payload: { filter: { name: 'joined' }}
        }));
      });

      suite('filters events based on authorization options', () => {
        test('sends public events to public users.', done => {
          const procedureId = uuid();
          const eventForPublic = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'John Doe'
          });
          let receivedMessages = 0;

          eventForPublic.metadata.isAuthorized = {
            owner: uuid(),
            forAuthenticated: true,
            forPublic: true
          };

          const onMessage = message => {
            receivedMessages += 1;

            switch (receivedMessages) {
              case 1:
                assert.that(JSON.parse(message)).is.equalTo({
                  type: 'subscribedEvents',
                  statusCode: 200,
                  procedureId
                });
                app.api.outgoing.write(eventForPublic);
                break;
              case 2:
                assert.that(JSON.parse(message).payload.data).is.equalTo({ participant: 'John Doe' });
                socket.removeListener('message', onMessage);

                return done();
              default:
                throw new Error('Should never be called.');
            }
          };

          socket.on('message', onMessage);
          socket.send(JSON.stringify({
            version: 'v1',
            type: 'subscribeEvents',
            procedureId
          }));
        });

        test('sends public events to authenticated users.', done => {
          const procedureId = uuid();
          const eventForPublic = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'John Doe'
          });
          let receivedMessages = 0;

          eventForPublic.metadata.isAuthorized = {
            owner: uuid(),
            forAuthenticated: true,
            forPublic: true
          };

          const onMessage = message => {
            receivedMessages += 1;

            switch (receivedMessages) {
              case 1:
                assert.that(JSON.parse(message)).is.equalTo({
                  type: 'subscribedEvents',
                  statusCode: 200,
                  procedureId
                });
                app.api.outgoing.write(eventForPublic);
                break;
              case 2:
                assert.that(JSON.parse(message).payload.data).is.equalTo({ participant: 'John Doe' });
                socket.removeListener('message', onMessage);

                return done();
              default:
                throw new Error('Should never be called.');
            }
          };

          socket.on('message', onMessage);
          socket.send(JSON.stringify({
            version: 'v1',
            type: 'subscribeEvents',
            procedureId,
            token: issueToken('Jane Doe')
          }));
        });

        test('sends public events to owners.', done => {
          const ownerId = uuid(),
                procedureId = uuid();
          const eventForPublic = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'John Doe'
          });
          let receivedMessages = 0;

          eventForPublic.metadata.isAuthorized = {
            owner: ownerId,
            forAuthenticated: true,
            forPublic: true
          };

          const onMessage = message => {
            receivedMessages += 1;

            switch (receivedMessages) {
              case 1:
                assert.that(JSON.parse(message)).is.equalTo({
                  type: 'subscribedEvents',
                  statusCode: 200,
                  procedureId
                });
                app.api.outgoing.write(eventForPublic);
                break;
              case 2:
                assert.that(JSON.parse(message).payload.data).is.equalTo({ participant: 'John Doe' });
                socket.removeListener('message', onMessage);

                return done();
              default:
                throw new Error('Should never be called.');
            }
          };

          socket.on('message', onMessage);
          socket.send(JSON.stringify({
            version: 'v1',
            type: 'subscribeEvents',
            procedureId,
            token: issueToken(ownerId)
          }));
        });

        test('does not send authenticated events to public users.', done => {
          let receivedMessages = 0;
          const procedureId = uuid();

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

          const onMessage = message => {
            receivedMessages += 1;

            switch (receivedMessages) {
              case 1:
                assert.that(JSON.parse(message)).is.equalTo({
                  type: 'subscribedEvents',
                  statusCode: 200,
                  procedureId
                });

                app.api.outgoing.write(eventForAuthenticated);
                setTimeout(() => {
                  app.api.outgoing.write(eventForPublic);
                }, 0.5 * 1000);

                break;
              case 2:
                assert.that(JSON.parse(message).payload.data).is.equalTo({ participant: 'John Doe' });
                socket.removeListener('message', onMessage);

                return done();
              default:
                throw new Error('Should never be called.');
            }
          };

          socket.on('message', onMessage);
          socket.send(JSON.stringify({
            version: 'v1',
            type: 'subscribeEvents',
            procedureId
          }));
        });

        test('sends authenticated events to authenticated users.', done => {
          let receivedMessages = 0;
          const procedureId = uuid();
          const eventForAuthenticated = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'Jane Doe'
          });

          eventForAuthenticated.metadata.isAuthorized = {
            owner: uuid(),
            forAuthenticated: true,
            forPublic: false
          };

          const onMessage = message => {
            receivedMessages += 1;

            switch (receivedMessages) {
              case 1:
                assert.that(JSON.parse(message)).is.equalTo({
                  type: 'subscribedEvents',
                  statusCode: 200,
                  procedureId
                });

                app.api.outgoing.write(eventForAuthenticated);
                break;
              case 2:
                assert.that(JSON.parse(message).payload.data).is.equalTo({ participant: 'Jane Doe' });
                socket.removeListener('message', onMessage);

                return done();
              default:
                throw new Error('Should never be called.');
            }
          };

          socket.on('message', onMessage);
          socket.send(JSON.stringify({
            version: 'v1',
            type: 'subscribeEvents',
            procedureId,
            token: issueToken('Jane Doe')
          }));
        });

        test('sends authenticated events to owners.', done => {
          let receivedMessages = 0;
          const procedureId = uuid();
          const ownerId = uuid();
          const eventForAuthenticated = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'Jane Doe'
          });

          eventForAuthenticated.metadata.isAuthorized = {
            owner: ownerId,
            forAuthenticated: true,
            forPublic: false
          };

          const onMessage = message => {
            receivedMessages += 1;

            switch (receivedMessages) {
              case 1:
                assert.that(JSON.parse(message)).is.equalTo({
                  type: 'subscribedEvents',
                  statusCode: 200,
                  procedureId
                });

                app.api.outgoing.write(eventForAuthenticated);
                break;
              case 2:
                assert.that(JSON.parse(message).payload.data).is.equalTo({ participant: 'Jane Doe' });
                socket.removeListener('message', onMessage);

                return done();
              default:
                throw new Error('Should never be called.');
            }
          };

          socket.on('message', onMessage);
          socket.send(JSON.stringify({
            version: 'v1',
            type: 'subscribeEvents',
            procedureId,
            token: issueToken(ownerId)
          }));
        });

        test('does not send owner events to public users.', done => {
          let receivedMessages = 0;
          const procedureId = uuid();
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

          const onMessage = message => {
            receivedMessages += 1;

            switch (receivedMessages) {
              case 1:
                assert.that(JSON.parse(message)).is.equalTo({
                  type: 'subscribedEvents',
                  statusCode: 200,
                  procedureId
                });

                app.api.outgoing.write(eventForOwner);

                setTimeout(() => {
                  app.api.outgoing.write(eventForPublic);
                }, 0.5 * 1000);
                break;
              case 2:
                assert.that(JSON.parse(message).payload.data).is.equalTo({ participant: 'John Doe' });
                socket.removeListener('message', onMessage);

                return done();
              default:
                throw new Error('Should never be called.');
            }
          };

          socket.on('message', onMessage);
          socket.send(JSON.stringify({
            version: 'v1',
            type: 'subscribeEvents',
            procedureId
          }));
        });

        test('does not send owner events to authenticated users.', done => {
          let receivedMessages = 0;
          const procedureId = uuid();
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

          const onMessage = message => {
            receivedMessages += 1;

            switch (receivedMessages) {
              case 1:
                assert.that(JSON.parse(message)).is.equalTo({
                  type: 'subscribedEvents',
                  statusCode: 200,
                  procedureId
                });

                app.api.outgoing.write(eventForOwner);

                setTimeout(() => {
                  app.api.outgoing.write(eventForPublic);
                }, 0.5 * 1000);
                break;
              case 2:
                assert.that(JSON.parse(message).payload.data).is.equalTo({ participant: 'John Doe' });
                socket.removeListener('message', onMessage);

                return done();
              default:
                throw new Error('Should never be called.');
            }
          };

          socket.on('message', onMessage);
          socket.send(JSON.stringify({
            version: 'v1',
            type: 'subscribeEvents',
            procedureId,
            token: issueToken('Jane Doe')
          }));
        });

        test('sends owner events to owners.', done => {
          let receivedMessages = 0;
          const procedureId = uuid();
          const ownerId = uuid();
          const eventForOwner = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'Jane Doe'
          });

          eventForOwner.metadata.isAuthorized = {
            owner: ownerId,
            forAuthenticated: false,
            forPublic: false
          };

          const onMessage = message => {
            receivedMessages += 1;

            switch (receivedMessages) {
              case 1:
                assert.that(JSON.parse(message)).is.equalTo({
                  type: 'subscribedEvents',
                  statusCode: 200,
                  procedureId
                });

                app.api.outgoing.write(eventForOwner);
                break;
              case 2:
                assert.that(JSON.parse(message).payload.data).is.equalTo({ participant: 'Jane Doe' });
                socket.removeListener('message', onMessage);

                return done();
              default:
                throw new Error('Should never be called.');
            }
          };

          socket.on('message', onMessage);
          socket.send(JSON.stringify({
            version: 'v1',
            type: 'subscribeEvents',
            procedureId,
            token: issueToken(ownerId)
          }));
        });
      });
    });

    suite('v1/subscribeRead', () => {
      test('returns 400 when payload is missing.', done => {
        const procedureId = uuid();
        const onMessage = message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Payload is missing.',
            statusCode: 400,
            procedureId
          });

          done();
        };

        socket.once('message', onMessage);
        socket.send(JSON.stringify({ version: 'v1', type: 'subscribeRead', procedureId }));
      });

      test('returns 400 when specifying a non-existent model type.', done => {
        const procedureId = uuid();
        const onMessage = message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Unknown model type.',
            procedureId,
            statusCode: 400
          });

          done();
        };

        socket.once('message', onMessage);
        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {}
        }));
      });

      test('returns 400 when specifying a non-existent model name.', done => {
        const procedureId = uuid();
        const onMessage = message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Unknown model name.',
            procedureId,
            statusCode: 400
          });

          done();
        };

        socket.once('message', onMessage);
        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists'
          }
        }));
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

        const procedureId = uuid();

        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings'
          }
        }));
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

        const procedureId = uuid();

        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings',
            query: {
              where: { lastName: 'Doe' }
            }
          }
        }));
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

        const procedureId = uuid();

        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings',
            query: {
              where: { lastName: 'Doe' }
            }
          },
          token: issueToken(ownerId)
        }));
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

        const procedureId = uuid();

        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings',
            query: {}
          }
        }));
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

        const procedureId = uuid();

        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings',
            query: {
              orderBy: { lastName: 'ascending' }
            }
          }
        }));
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

        const procedureId = uuid();

        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings'
          }
        }));
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

        const procedureId = uuid();

        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings',
            query: {
              skip: 23
            }
          }
        }));
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

        const procedureId = uuid();

        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings'
          }
        }));
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

        const procedureId = uuid();

        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings',
            query: {
              skip: 'abc'
            }
          }
        }));
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

        const procedureId = uuid();

        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings',
            query: {
              take: 23
            }
          }
        }));
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

        const procedureId = uuid();

        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings'
          }
        }));
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

        const procedureId = uuid();

        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings',
            query: {
              take: 'abc'
            }
          }
        }));
      });

      test('returns 400 when an invalid where is given.', done => {
        const procedureId = uuid();
        const onMessage = message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Invalid query.',
            procedureId,
            statusCode: 400
          });

          done();
        };

        socket.once('message', onMessage);
        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings',
            query: {
              where: 'foo'
            }
          }
        }));
      });

      test('returns 400 when an invalid order by is given.', done => {
        const procedureId = uuid();
        const onMessage = message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Invalid query.',
            procedureId,
            statusCode: 400
          });

          done();
        };

        socket.once('message', onMessage);
        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings',
            query: {
              orderBy: 'foo'
            }
          }
        }));
      });

      test('returns 500 when read returns an error.', done => {
        app.api.read = function (modelType, modelName, options, callback) {
          return callback(new Error());
        };

        const procedureId = uuid();
        const onMessage = message => {
          assert.that(JSON.parse(message)).is.equalTo({
            type: 'error',
            payload: 'Unable to load model.',
            procedureId,
            statusCode: 500
          });

          done();
        };

        socket.once('message', onMessage);
        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings'
          }
        }));
      });

      test('streams a single data item from the app.api.read function to the client.', done => {
        let fakeModelDataStream;

        app.api.read = function (modelType, modelName, options, callback) {
          fakeModelDataStream = new PassThrough({ objectMode: true });

          return callback(null, fakeModelDataStream);
        };

        let receivedMessages = 0;
        const procedureId = uuid();
        const onMessage = message => {
          receivedMessages += 1;

          switch (receivedMessages) {
            case 1:
              assert.that(JSON.parse(message)).is.equalTo({
                type: 'subscribedRead',
                procedureId,
                statusCode: 200
              });
              fakeModelDataStream.write({ foo: 'bar' });
              fakeModelDataStream.end();
              break;
            case 2:
              assert.that(JSON.parse(message)).is.equalTo({
                type: 'item',
                procedureId,
                payload: { foo: 'bar' },
                statusCode: 200
              });
              break;
            case 3:
              assert.that(JSON.parse(message)).is.equalTo({
                type: 'finish',
                procedureId,
                statusCode: 200
              });
              socket.removeListener('message', onMessage);

              return done();
            default:
              throw new Error('Should never be called.');
          }
        };

        socket.on('message', onMessage);
        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings'
          }
        }));
      });

      test('returns multiple documents as JSON.', done => {
        let fakeModelDataStream;

        app.api.read = function (modelType, modelName, options, callback) {
          fakeModelDataStream = new PassThrough({ objectMode: true });

          return callback(null, fakeModelDataStream);
        };

        let receivedMessages = 0;
        const procedureId = uuid();
        const onMessage = message => {
          receivedMessages += 1;

          switch (receivedMessages) {
            case 1:
              assert.that(JSON.parse(message)).is.equalTo({
                type: 'subscribedRead',
                procedureId,
                statusCode: 200
              });
              fakeModelDataStream.write({ foo: 'bar' });
              fakeModelDataStream.write({ foo: 'baz' });
              fakeModelDataStream.end();
              break;
            case 2:
              assert.that(JSON.parse(message)).is.equalTo({
                type: 'item',
                procedureId,
                payload: { foo: 'bar' },
                statusCode: 200
              });
              break;
            case 3:
              assert.that(JSON.parse(message)).is.equalTo({
                type: 'item',
                procedureId,
                payload: { foo: 'baz' },
                statusCode: 200
              });
              break;
            case 4:
              assert.that(JSON.parse(message)).is.equalTo({
                type: 'finish',
                procedureId,
                statusCode: 200
              });
              socket.removeListener('message', onMessage);

              return done();
            default:
              throw new Error('Should never be called.');
          }
        };

        socket.on('message', onMessage);
        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings'
          }
        }));
      });

      test('closes the stream when the client unsubscribes.', done => {
        let fakeModelDataStream;

        app.api.read = function (modelType, modelName, options, callback) {
          fakeModelDataStream = new PassThrough({ objectMode: true });
          fakeModelDataStream.write({ foo: 'bar' });

          return callback(null, fakeModelDataStream);
        };

        let receivedMessages = 0;
        const procedureId = uuid();
        const onMessage = message => {
          receivedMessages += 1;

          switch (receivedMessages) {
            case 1:
              assert.that(JSON.parse(message)).is.equalTo({
                type: 'subscribedRead',
                procedureId,
                statusCode: 200
              });
              break;
            case 2:
              assert.that(JSON.parse(message)).is.equalTo({
                type: 'item',
                procedureId,
                statusCode: 200,
                payload: { foo: 'bar' }
              });
              socket.send(JSON.stringify({
                version: 'v1',
                type: 'unsubscribeRead',
                procedureId
              }));
              break;
            case 3:
              assert.that(JSON.parse(message)).is.equalTo({
                type: 'unsubscribedRead',
                procedureId,
                statusCode: 200
              });

              fakeModelDataStream.once('error', err => {
                assert.that(err.message).is.equalTo('write after end');
                done();
              }).write({ foo: 'bar' });

              return done();
            default:
              throw new Error('Shoul never be called.');
          }
        };

        socket.on('message', onMessage);
        socket.send(JSON.stringify({
          version: 'v1',
          type: 'subscribeRead',
          procedureId,
          payload: {
            modelType: 'lists',
            modelName: 'pings'
          }
        }));
      });
    });
  });
});
