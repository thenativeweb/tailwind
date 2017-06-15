'use strict';

const path = require('path');

const assert = require('assertthat'),
      async = require('async'),
      shell = require('shelljs');

const env = require('../../../helpers/env'),
      tailwind = require('../../../../lib/tailwind'),
      waitForRabbitMq = require('../../../helpers/waitForRabbitMq');

suite('commandbus', () => {
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
              appReceiver.commandbus.use(new appReceiver.wires.commandbus.amqp.Receiver({
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
              appSender.commandbus.use(new appSender.wires.commandbus.amqp.Sender({
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

    test('sends and receives commands.', function (done) {
      this.timeout(20 * 1000);

      const command = new appSender.Command({
        context: {
          name: 'Planning'
        },
        aggregate: {
          name: 'PeerGroup',
          id: 'dfa1c416-32e6-431a-8d65-27ba0fc3e978'
        },
        name: 'Join',
        data: {
          foo: 'foobar'
        }
      });

      appReceiver.commandbus.incoming.once('data', actual => {
        actual.next();
        assert.that(actual.context.name).is.equalTo(command.context.name);
        assert.that(actual.aggregate.name).is.equalTo(command.aggregate.name);
        assert.that(actual.aggregate.id).is.equalTo(command.aggregate.id);
        assert.that(actual.name).is.equalTo(command.name);
        assert.that(actual.id).is.equalTo(command.id);
        assert.that(actual.data).is.equalTo(command.data);
        assert.that(actual.metadata.correlationId).is.equalTo(command.metadata.correlationId);
        assert.that(actual.metadata.causationId).is.equalTo(command.metadata.causationId);
        assert.that(actual.metadata.timestamp).is.equalTo(command.metadata.timestamp);
        done();
      });

      appSender.commandbus.outgoing.write(command);
    });

    suite('incoming', () => {
      test('emits a disconnect event when the wire has been disconnected.', function (done) {
        this.timeout(15 * 1000);

        appReceiver.commandbus.incoming.once('disconnect', () => {
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

        appSender.commandbus.outgoing.once('disconnect', () => {
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
