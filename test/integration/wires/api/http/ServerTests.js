'use strict';

const { PassThrough } = require('stream'),
      path = require('path');

const assert = require('assertthat'),
      freeport = require('freeport-promise'),
      jsonLinesClient = require('json-lines-client'),
      needle = require('needle'),
      uuid = require('uuidv4');

const buildEvent = require('../../../../shared/buildEvent'),
      issueToken = require('../../../../shared/issueToken'),
      startApp = require('./startApp');

suite('Server', () => {
  suite('routes', () => {
    let app,
        port;

    setup(async () => {
      port = await freeport();
      app = await startApp({ port, corsOrigin: '*' });
    });

    test('delivers the correct CORS headers.', async () => {
      const corsOrigins = [
        {
          origin: 'http://www.thenativeweb.io',
          allow: '*',
          expected: '*'
        }, {
          origin: 'http://www.thenativeweb.io',
          allow: 'http://www.thenativeweb.io',
          expected: 'http://www.thenativeweb.io'
        }, {
          origin: 'http://www.thenativeweb.io',
          allow: /\.thenativeweb\.io$/,
          expected: 'http://www.thenativeweb.io'
        }, {
          origin: 'http://www.example.com',
          allow: /\.thenativeweb\.io$/,
          expected: undefined
        }, {
          origin: 'http://www.thenativeweb.io',
          allow: [ 'http://www.thenativeweb.io', 'http://www.example.com' ],
          expected: 'http://www.thenativeweb.io'
        }, {
          origin: 'http://www.example.com',
          allow: 'http://www.thenativeweb.io',
          expected: undefined
        }
      ];

      for (const corsOrigin of corsOrigins) {
        port = await freeport();

        await startApp({ port, corsOrigin: corsOrigin.allow });

        const res = await needle('options', `http://localhost:${port}/v1/ping`, undefined, {
          headers: {
            origin: corsOrigin.origin,
            'access-control-request-method': 'POST',
            'access-control-request-headers': 'X-Requested-With'
          }
        });

        assert.that(res.headers['access-control-allow-origin']).is.equalTo(corsOrigin.expected);
        assert.that(res.headers['access-control-allow-methods']).is.equalTo('GET,POST');
        assert.that(res.statusCode).is.equalTo(200);
      }
    });

    suite('GET /v1/ping', () => {
      test('returns 200.', async () => {
        const res = await needle('get', `http://localhost:${port}/v1/ping`);

        assert.that(res.statusCode).is.equalTo(200);
      });

      test('returns application/json.', async () => {
        const res = await needle('get', `http://localhost:${port}/v1/ping`);

        assert.that(res.headers['content-type']).is.equalTo('application/json; charset=utf-8');
      });

      test('answers with api version v1.', async () => {
        const res = await needle('get', `http://localhost:${port}/v1/ping`);

        assert.that(res.body).is.equalTo({ api: 'v1' });
      });
    });

    suite('GET /v1/configuration.json', () => {
      test('returns 200.', async () => {
        const res = await needle('get', `http://localhost:${port}/v1/configuration.json`);

        assert.that(res.statusCode).is.equalTo(200);
      });

      test('returns text/javascript.', async () => {
        const res = await needle('get', `http://localhost:${port}/v1/configuration.json`);

        assert.that(res.headers['content-type']).is.equalTo('application/json; charset=utf-8');
      });

      test('serves the application configuration.', async () => {
        const res = await needle('get', `http://localhost:${port}/v1/configuration.json`);

        assert.that(res.body).is.ofType('object');
        assert.that(res.body.writeModel).is.equalTo({
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
        });
        assert.that(res.body.readModel).is.equalTo({
          lists: {
            pings: {}
          }
        });
      });
    });

    suite('POST /v1/command', () => {
      test('returns 415 if the content-type header is missing.', async () => {
        const res = await needle('post', `http://localhost:${port}/v1/command`, 'foobar');

        assert.that(res.statusCode).is.equalTo(415);
        assert.that(res.body).is.equalTo('Header content-type must be application/json.');
      });

      test('returns 415 if content-type is not set to application/json.', async () => {
        const res = await needle('post', `http://localhost:${port}/v1/command`, 'foobar', {
          headers: {
            'content-type': 'text/plain'
          },
          json: true
        });

        assert.that(res.statusCode).is.equalTo(415);
        assert.that(res.body).is.equalTo('Header content-type must be application/json.');
      });

      test('returns 400 if a malformed command is sent.', async () => {
        const res = await needle('post', `http://localhost:${port}/v1/command`, {
          foo: 'bar'
        }, {
          json: true
        });

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.body).is.equalTo('Malformed command.');
      });

      test('returns 400 if a wellformed command is sent with a non-existent context name.', async () => {
        const command = new app.Command({
          context: { name: 'foo' },
          aggregate: { name: 'node', id: uuid() },
          name: 'ping',
          data: { foo: 'foobar' }
        });

        const res = await needle('post', `http://localhost:${port}/v1/command`, command, {
          json: true
        });

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.body).is.equalTo('Unknown context name.');
      });

      test('returns 400 if a wellformed command is sent with a non-existent aggregate name.', async () => {
        const command = new app.Command({
          context: { name: 'network' },
          aggregate: { name: 'foo', id: uuid() },
          name: 'ping',
          data: { foo: 'foobar' }
        });

        const res = await needle('post', `http://localhost:${port}/v1/command`, command, {
          json: true
        });

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.body).is.equalTo('Unknown aggregate name.');
      });

      test('returns 400 if a wellformed command is sent with a non-existent command name.', async () => {
        const command = new app.Command({
          context: { name: 'network' },
          aggregate: { name: 'node', id: uuid() },
          name: 'foo',
          data: { foo: 'foobar' }
        });

        const res = await needle('post', `http://localhost:${port}/v1/command`, command, {
          json: true
        });

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.body).is.equalTo('Unknown command name.');
      });

      test('returns 200 if a wellformed command is sent and everything is fine.', async () => {
        const command = new app.Command({
          context: { name: 'network' },
          aggregate: { name: 'node', id: uuid() },
          name: 'ping',
          data: { foo: 'foobar' }
        });

        await new Promise((resolve, reject) => {
          app.api.incoming.once('data', () => {
            resolve();
          });

          (async () => {
            try {
              const res = await needle('post', `http://localhost:${port}/v1/command`, command, {
                json: true
              });

              assert.that(res.statusCode).is.equalTo(200);
            } catch (ex) {
              reject(ex);
            }
          })();
        });
      });

      test('emits an incoming command to the app.api.incoming stream.', async () => {
        const command = new app.Command({
          context: { name: 'network' },
          aggregate: { name: 'node', id: uuid() },
          name: 'ping',
          data: { foo: 'foobar' }
        });

        await new Promise((resolve, reject) => {
          app.api.incoming.once('data', message => {
            const receivedCommand = message.command,
                  receivedMetadata = message.metadata;

            try {
              assert.that(receivedCommand.context.name).is.equalTo(command.context.name);
              assert.that(receivedCommand.aggregate.name).is.equalTo(command.aggregate.name);
              assert.that(receivedCommand.aggregate.id).is.equalTo(command.aggregate.id);
              assert.that(receivedCommand.name).is.equalTo(command.name);
              assert.that(receivedCommand.data).is.equalTo(command.data);
              assert.that(receivedCommand.initiator.id).is.equalTo('anonymous');
              assert.that(receivedCommand.initiator.token.sub).is.equalTo('anonymous');
              assert.that(receivedCommand.initiator.token.iss).is.equalTo('https://token.invalid');

              assert.that(receivedMetadata.client).is.ofType('object');
              assert.that(receivedMetadata.client.user).is.ofType('object');
              assert.that(receivedMetadata.client.user.id).is.equalTo('anonymous');
              assert.that(receivedMetadata.client.user.token).is.ofType('object');
              assert.that(receivedMetadata.client.user.token.sub).is.equalTo('anonymous');
              assert.that(receivedMetadata.client.ip).is.ofType('string');
            } catch (ex) {
              return reject(ex);
            }
            resolve();
          });

          needle.post(`http://localhost:${port}/v1/command`, command, {
            json: true
          });
        });
      });
    });

    suite('POST /v1/events', () => {
      test('receives an event from the app.api.outgoing stream.', async () => {
        const joinedEvent = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
          participant: 'Jane Doe'
        });

        app.api.willPublishEvent = function ({ event }) {
          return event;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/events'
        });

        await new Promise((resolve, reject) => {
          server.stream.once('data', event => {
            try {
              assert.that(event.data).is.equalTo({ participant: 'Jane Doe' });

              server.disconnect();
            } catch (ex) {
              return reject(ex);
            }
            resolve();
          });

          app.api.outgoing.write({ event: joinedEvent, metadata: {}});
        });
      });

      test('receives multiple events from the app.api.outgoing stream.', async () => {
        app.api.willPublishEvent = function ({ event }) {
          return event;
        };

        const joinedEvent1 = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
          participant: 'Jane Doe'
        });
        const joinedEvent2 = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
          participant: 'John Doe'
        });

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/events'
        });

        await new Promise((resolve, reject) => {
          let counter = 0;

          const onData = function (event) {
            try {
              counter += 1;

              switch (counter) {
                case 1: {
                  assert.that(event.data).is.equalTo({ participant: 'Jane Doe' });
                  break;
                }
                case 2: {
                  assert.that(event.data).is.equalTo({ participant: 'John Doe' });
                  server.disconnect();
                  server.stream.removeListener('data', onData);
                  resolve();
                  break;
                }
                default: {
                  // Intentionally left blank.
                }
              }
            } catch (ex) {
              reject(ex);
            }
          };

          server.stream.on('data', onData);

          app.api.outgoing.write({ event: joinedEvent1, metadata: {}});
          app.api.outgoing.write({ event: joinedEvent2, metadata: {}});
        });
      });

      test('receives filtered events from the app.api.outgoing stream.', async () => {
        app.api.willPublishEvent = function ({ event }) {
          return event;
        };

        const startedEvent = buildEvent('planning', 'peerGroup', uuid(), 'started', {
          participant: 'Jane Doe'
        });
        const joinedEvent = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
          participant: 'John Doe'
        });

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/events',
          body: {
            name: 'joined'
          }
        });

        await new Promise((resolve, reject) => {
          server.stream.once('data', event => {
            try {
              assert.that(event.data).is.equalTo({
                participant: 'John Doe'
              });

              server.disconnect();
            } catch (ex) {
              return reject(ex);
            }

            resolve();
          });

          app.api.outgoing.write({ event: startedEvent, metadata: {}});
          app.api.outgoing.write({ event: joinedEvent, metadata: {}});
        });
      });

      suite('willPublishEvent', () => {
        test('is called with an event and metadata.', async () => {
          const joinedEvent = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'Jane Doe'
          });

          const joinedMetadata = { foo: 'bar' };

          app.api.willPublishEvent = function ({ event, metadata }) {
            assert.that(event.data).is.equalTo({ participant: 'Jane Doe' });
            assert.that(metadata.foo).is.equalTo('bar');
            assert.that(metadata.client).is.ofType('object');
            assert.that(metadata.client.user).is.ofType('object');
            assert.that(metadata.client.user.id).is.equalTo('anonymous');
            assert.that(metadata.client.user.token).is.ofType('object');
            assert.that(metadata.client.user.token.sub).is.equalTo('anonymous');
            assert.that(metadata.client.ip).is.ofType('string');

            return event;
          };

          const server = await jsonLinesClient({
            protocol: 'http',
            host: 'localhost',
            port,
            path: '/v1/events'
          });

          await new Promise(resolve => {
            server.stream.once('data', () => {
              server.disconnect();
              resolve();
            });

            app.api.outgoing.write({ event: joinedEvent, metadata: joinedMetadata });
          });
        });

        test('does not filter events if willPublishEvent returns an event.', async () => {
          app.api.willPublishEvent = function ({ event }) {
            return event;
          };

          const event = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'John Doe'
          });

          const server = await jsonLinesClient({
            protocol: 'http',
            host: 'localhost',
            port,
            path: '/v1/events'
          });

          await new Promise((resolve, reject) => {
            server.stream.once('data', receivedEvent => {
              try {
                assert.that(receivedEvent.data).is.equalTo({
                  participant: 'John Doe'
                });

                server.disconnect();
              } catch (ex) {
                return reject(ex);
              }
              resolve();
            });

            app.api.outgoing.write({ event, metadata: {}});
          });
        });

        test('filters events if willPublishEvent does not return an event.', async () => {
          app.api.willPublishEvent = function ({ event }) {
            if (event.name === 'started') {
              return;
            }

            return event;
          };

          const eventStarted = buildEvent('planning', 'peerGroup', uuid(), 'started', {
            initiator: 'Jane Doe',
            destination: 'Riva'
          });
          const eventJoined = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'John Doe'
          });

          const server = await jsonLinesClient({
            protocol: 'http',
            host: 'localhost',
            port,
            path: '/v1/events'
          });

          await new Promise((resolve, reject) => {
            server.stream.once('data', event => {
              try {
                assert.that(event.data).is.equalTo({
                  participant: 'John Doe'
                });

                server.disconnect();
              } catch (ex) {
                return reject(ex);
              }
              resolve();
            });

            app.api.outgoing.write({ event: eventStarted, metadata: {}});
            app.api.outgoing.write({ event: eventJoined, metadata: {}});
          });
        });

        test('filters events if willPublishEvent throws an error.', async () => {
          app.api.willPublishEvent = function ({ event }) {
            if (event.name === 'started') {
              throw new Error('Will publish event failed.');
            }

            return event;
          };

          const eventStarted = buildEvent('planning', 'peerGroup', uuid(), 'started', {
            initiator: 'Jane Doe',
            destination: 'Riva'
          });
          const eventJoined = buildEvent('planning', 'peerGroup', uuid(), 'joined', {
            participant: 'John Doe'
          });

          const server = await jsonLinesClient({
            protocol: 'http',
            host: 'localhost',
            port,
            path: '/v1/events'
          });

          await new Promise((resolve, reject) => {
            server.stream.once('data', event => {
              try {
                assert.that(event.data).is.equalTo({
                  participant: 'John Doe'
                });

                server.disconnect();
              } catch (ex) {
                return reject(ex);
              }
              resolve();
            });

            app.api.outgoing.write({ event: eventStarted, metadata: {}});
            app.api.outgoing.write({ event: eventJoined, metadata: {}});
          });
        });
      });
    });

    suite('POST /v1/read/:modelType/:modelName?where=...&orderBy=...&skip=...&take=...', () => {
      test('returns 404 when no model type is given.', async () => {
        await assert.that(async () => {
          await jsonLinesClient({
            protocol: 'http',
            host: 'localhost',
            port,
            path: '/v1/read'
          });
        }).is.throwingAsync(ex => ex.code === 'ESTATUSCODEUNEXPECTED');
      });

      test('returns 404 when no model name is given.', async () => {
        await assert.that(async () => {
          await jsonLinesClient({
            protocol: 'http',
            host: 'localhost',
            port,
            path: '/v1/read/Lists'
          });
        }).is.throwingAsync(ex => ex.code === 'ESTATUSCODEUNEXPECTED');
      });

      test('returns 400 when specifying a non-existent model type.', async () => {
        await assert.that(async () => {
          await jsonLinesClient({
            protocol: 'http',
            host: 'localhost',
            port,
            path: '/v1/read/non-existent/foo'
          });
        }).is.throwingAsync(ex => ex.code === 'ESTATUSCODEUNEXPECTED');
      });

      test('returns 400 when specifying a non-existent model name.', async () => {
        await assert.that(async () => {
          await jsonLinesClient({
            protocol: 'http',
            host: 'localhost',
            port,
            path: '/v1/read/lists/foo'
          });
        }).is.throwingAsync(ex => ex.code === 'ESTATUSCODEUNEXPECTED');
      });

      test('passes the given model type and model name to the app.api.read function.', async () => {
        app.api.read = async function ({ modelType, modelName }) {
          assert.that(modelType).is.equalTo('lists');
          assert.that(modelName).is.equalTo('pings');

          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings'
        });

        await new Promise(resolve => {
          server.stream.once('end', () => {
            resolve();
          });

          server.stream.resume();
        });
      });

      test('passes the given where to the app.api.read function.', async () => {
        app.api.read = async function ({ query: { where }}) {
          assert.that(where).is.equalTo({
            $and: [
              { lastName: 'Doe' },
              { $or: [
                { 'isAuthorized.owner': 'anonymous' },
                { 'isAuthorized.forPublic': true }
              ]}
            ]
          });

          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings',
          query: {
            where: JSON.stringify({ lastName: 'Doe' })
          }
        });

        await new Promise(resolve => {
          server.stream.once('end', () => {
            resolve();
          });

          server.stream.resume();
        });
      });

      test('attaches the authenticated user to the where clause.', async () => {
        const ownerId = uuid();

        app.api.read = async function ({ query: { where }}) {
          assert.that(where).is.equalTo({
            $and: [
              { lastName: 'Doe' },
              { $or: [
                { 'isAuthorized.owner': ownerId },
                { 'isAuthorized.forPublic': true },
                { 'isAuthorized.forAuthenticated': true }
              ]}
            ]
          });

          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings',
          query: {
            where: JSON.stringify({ lastName: 'Doe' })
          },
          headers: {
            authorization: `Bearer ${issueToken(ownerId)}`
          }
        });

        await new Promise(resolve => {
          server.stream.once('end', () => {
            resolve();
          });

          server.stream.resume();
        });
      });

      test('falls back to an empty where if where is missing.', async () => {
        app.api.read = async function ({ query: { where }}) {
          assert.that(where).is.equalTo({
            $and: [
              {},
              { $or: [
                { 'isAuthorized.owner': 'anonymous' },
                { 'isAuthorized.forPublic': true }
              ]}
            ]
          });

          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings'
        });

        await new Promise(resolve => {
          server.stream.once('end', () => {
            resolve();
          });

          server.stream.resume();
        });
      });

      test('passes the given order by to the app.api.read function.', async () => {
        app.api.read = async function ({ query: { orderBy }}) {
          assert.that(orderBy).is.equalTo({ lastName: 'ascending' });

          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings',
          query: {
            orderBy: JSON.stringify({ lastName: 'ascending' })
          }
        });

        await new Promise(resolve => {
          server.stream.once('end', () => {
            resolve();
          });

          server.stream.resume();
        });
      });

      test('falls back to an empty order by if order by is missing.', async () => {
        app.api.read = async function ({ query: { orderBy }}) {
          assert.that(orderBy).is.equalTo({});

          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings'
        });

        await new Promise(resolve => {
          server.stream.once('end', () => {
            resolve();
          });

          server.stream.resume();
        });
      });

      test('passes the given skip to the app.api.read function.', async () => {
        app.api.read = async function ({ query: { skip }}) {
          assert.that(skip).is.equalTo(23);

          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings',
          query: {
            skip: 23
          }
        });

        await new Promise(resolve => {
          server.stream.once('end', () => {
            resolve();
          });

          server.stream.resume();
        });
      });

      test('falls back to skip=0 if skip is missing.', async () => {
        app.api.read = async function ({ query: { skip }}) {
          assert.that(skip).is.equalTo(0);

          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings'
        });

        await new Promise(resolve => {
          server.stream.once('end', () => {
            resolve();
          });

          server.stream.resume();
        });
      });

      test('falls back to skip=0 if skip is invalid.', async () => {
        app.api.read = async function ({ query: { skip }}) {
          assert.that(skip).is.equalTo(0);

          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings',
          query: {
            skip: 'abc'
          }
        });

        await new Promise(resolve => {
          server.stream.once('end', () => {
            resolve();
          });

          server.stream.resume();
        });
      });

      test('passes the given take to the app.api.read function.', async () => {
        app.api.read = async function ({ query: { take }}) {
          assert.that(take).is.equalTo(23);

          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings',
          query: {
            take: 23
          }
        });

        await new Promise(resolve => {
          server.stream.once('end', () => {
            resolve();
          });

          server.stream.resume();
        });
      });

      test('falls back to take=100 if take is missing.', async () => {
        app.api.read = async function ({ query: { take }}) {
          assert.that(take).is.equalTo(100);

          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings'
        });

        await new Promise(resolve => {
          server.stream.once('end', () => {
            resolve();
          });

          server.stream.resume();
        });
      });

      test('falls back to take=100 if take is invalid.', async () => {
        app.api.read = async function ({ query: { take }}) {
          assert.that(take).is.equalTo(100);

          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings',
          query: {
            take: 'abc'
          }
        });

        await new Promise(resolve => {
          server.stream.once('end', () => {
            resolve();
          });

          server.stream.resume();
        });
      });

      test('passes the user to the app.api.read function.', async () => {
        const ownerId = uuid();

        app.api.read = async function ({ user }) {
          assert.that(user).is.atLeast({
            id: ownerId,
            token: {
              iss: 'https://auth.thenativeweb.io',
              sub: ownerId
            }
          });

          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings',
          query: {
            where: JSON.stringify({ lastName: 'Doe' })
          },
          headers: {
            authorization: `Bearer ${issueToken(ownerId)}`
          }
        });

        await new Promise(resolve => {
          server.stream.once('end', () => {
            resolve();
          });

          server.stream.resume();
        });
      });

      test('returns 400 when an invalid where is given.', async () => {
        await assert.that(async () => {
          await jsonLinesClient({
            protocol: 'http',
            host: 'localhost',
            port,
            path: '/v1/read/lists/pings',
            query: {
              where: 'foo'
            }
          });
        }).is.throwingAsync(ex => ex.code === 'ESTATUSCODEUNEXPECTED');
      });

      test('returns 400 when an invalid order by is given.', async () => {
        await assert.that(async () => {
          await jsonLinesClient({
            protocol: 'http',
            host: 'localhost',
            port,
            path: '/v1/read/lists/pings',
            query: {
              orderBy: 'foo'
            }
          });
        }).is.throwingAsync(ex => ex.code === 'ESTATUSCODEUNEXPECTED');
      });

      test('returns 500 when read returns an error.', async () => {
        app.api.read = async function () {
          throw new Error();
        };

        await assert.that(async () => {
          await jsonLinesClient({
            protocol: 'http',
            host: 'localhost',
            port,
            path: '/v1/read/lists/pings'
          });
        }).is.throwingAsync(ex => ex.code === 'ESTATUSCODEUNEXPECTED');
      });

      test('streams a single data item from the app.api.read function to the client.', async () => {
        app.api.read = async function () {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.write({ foo: 'bar' });
          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings'
        });

        await new Promise((resolve, reject) => {
          server.stream.once('data', modelEvent => {
            try {
              assert.that(modelEvent).is.equalTo({ foo: 'bar' });
            } catch (ex) {
              return reject(ex);
            }
            resolve();
          });
        });
      });

      test('returns multiple documents as JSON.', async () => {
        app.api.read = async function () {
          const fakeStream = new PassThrough({ objectMode: true });

          fakeStream.write({ foo: 'bar' });
          fakeStream.write({ foo: 'baz' });
          fakeStream.end();

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings'
        });

        await new Promise((resolve, reject) => {
          let counter = 0;

          server.stream.on('data', modelEvent => {
            try {
              counter += 1;

              switch (counter) {
                case 1:
                  assert.that(modelEvent).is.equalTo({ foo: 'bar' });
                  break;
                case 2:
                  assert.that(modelEvent).is.equalTo({ foo: 'baz' });
                  resolve();
                  break;
                default:
                  throw new Error('Invalid operation.');
              }
            } catch (ex) {
              return reject(ex);
            }
          });
        });
      });

      test('closes the stream when the client disconnects.', async () => {
        const fakeStream = new PassThrough({ objectMode: true });

        app.api.read = async function () {
          fakeStream.write({ foo: 'bar' });

          return fakeStream;
        };

        const server = await jsonLinesClient({
          protocol: 'http',
          host: 'localhost',
          port,
          path: '/v1/read/lists/pings'
        });

        server.disconnect();

        // Wait a short time to give the stream the chance to close.
        await new Promise(resolve => setTimeout(resolve, 0.1 * 1000));

        await new Promise((resolve, reject) => {
          fakeStream.once('error', err => {
            try {
              assert.that(err.message).is.equalTo('write after end');
            } catch (ex) {
              return reject(ex);
            }
            resolve();
          }).write({ foo: 'bar' });
        });
      });
    });
  });

  suite('serveStatic', () => {
    suiteSetup(async () => {
      const staticDirectory = path.join(__dirname, 'serveStatic');

      await startApp({ port: 2999, corsOrigin: '*', serveStatic: staticDirectory });
    });

    test('serves static content from given directory.', async () => {
      const res = await needle('get', 'http://localhost:2999/test.txt');

      assert.that(res.statusCode).is.equalTo(200);
      assert.that(res.body).is.ofType('string');
      assert.that(res.body).is.equalTo('This is a static file.\n');
    });

    test('uses gzip compression.', async () => {
      const res = await needle('get', 'http://localhost:2999/compression-test.html', {
        headers: {
          'Accept-Encoding': 'gzip, deflate'
        }
      });

      assert.that(res.statusCode).is.equalTo(200);
      assert.that(res.headers['content-encoding']).is.equalTo('gzip');
    });
  });
});
