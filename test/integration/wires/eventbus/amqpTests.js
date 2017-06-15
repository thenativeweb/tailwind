'use strict';

const path = require('path');

const assert = require('assertthat'),
      async = require('async'),
      shell = require('shelljs');

const env = require('../../../helpers/env'),
      tailwind = require('../../../../lib/tailwind'),
      waitForRabbitMq = require('../../../helpers/waitForRabbitMq');

suite('eventbus', () => {
  suite('amqp', () => {
    let appReceiver,
        appSender;

    setup(done => {
      appSender = tailwind.createApp({
        keys: path.join(__dirname, '..', '..', '..', 'keys'),
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', '..', '..', 'keys', 'certificate.pem')
        }
      });
      appReceiver = tailwind.createApp({
        keys: path.join(__dirname, '..', '..', '..', 'keys'),
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', '..', '..', 'keys', 'certificate.pem')
        }
      });

      async.series([
        callback => {
          appReceiver.run([
            cb => {
              appReceiver.eventbus.use(new appReceiver.wires.eventbus.amqp.Receiver({
                url: env.RABBITMQ_URL,
                application: 'Plcr'
              }), cb);
            },
            () => {
              callback(null);
            }
          ]);
        },
        callback => {
          appSender.run([
            cb => {
              appSender.eventbus.use(new appSender.wires.eventbus.amqp.Sender({
                url: env.RABBITMQ_URL,
                application: 'Plcr'
              }), cb);
            },
            () => {
              callback(null);
            }
          ]);
        }
      ], err => {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    test('sends and receives events.', done => {
      const evt = new appSender.Event({
        context: {
          name: 'Planning'
        },
        aggregate: {
          name: 'PeerGroup',
          id: 'dfa1c416-32e6-431a-8d65-27ba0fc3e978'
        },
        name: 'Joined',
        data: {
          foo: 'foobar'
        },
        metadata: {
          correlationId: 'bb49053c-66ba-4dd9-8eab-b1f69985248c',
          causationId: 'bb49053c-66ba-4dd9-8eab-b1f69985248c'
        }
      });

      appReceiver.eventbus.incoming.once('data', actual => {
        actual.next();
        assert.that(actual.context.name).is.equalTo(evt.context.name);
        assert.that(actual.aggregate.name).is.equalTo(evt.aggregate.name);
        assert.that(actual.aggregate.id).is.equalTo(evt.aggregate.id);
        assert.that(actual.name).is.equalTo(evt.name);
        assert.that(actual.id).is.equalTo(evt.id);
        assert.that(actual.data).is.equalTo(evt.data);
        assert.that(actual.metadata.correlationId).is.equalTo(evt.metadata.correlationId);
        assert.that(actual.metadata.causationId).is.equalTo(evt.metadata.causationId);
        done();
      });

      appSender.eventbus.outgoing.write(evt);
    });

    suite('incoming', () => {
      test('emits a disconnect event when the wire has been disconnected.', function (done) {
        this.timeout(15 * 1000);

        appReceiver.eventbus.incoming.once('disconnect', () => {
          shell.exec('docker start rabbitmq', exitCode => {
            assert.that(exitCode).is.equalTo(0);
            waitForRabbitMq(done);
          });
        });

        shell.exec('docker kill rabbitmq');
      });
    });

    suite('outgoing', () => {
      test('emits a disconnect event when the wire has been disconnected.', function (done) {
        this.timeout(15 * 1000);

        appSender.eventbus.outgoing.once('disconnect', () => {
          shell.exec('docker start rabbitmq', exitCode => {
            assert.that(exitCode).is.equalTo(0);
            waitForRabbitMq(done);
          });
        });

        shell.exec('docker kill rabbitmq');
      });
    });
  });
});
