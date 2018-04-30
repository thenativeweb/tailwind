'use strict';

const path = require('path');

const assert = require('assertthat'),
      shell = require('shelljs');

const env = require('../../../shared/env'),
      tailwind = require('../../../../src/tailwind'),
      waitForRabbitMq = require('../../../shared/waitForRabbitMq');

suite('commandbus', () => {
  suite('amqp', function () {
    this.timeout(20 * 1000);

    let appReceiver,
        appSender;

    setup(async () => {
      appSender = tailwind.createApp({
        keys: path.join(__dirname, '..', '..', '..', 'shared', 'keys'),
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', '..', '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      appReceiver = tailwind.createApp({
        keys: path.join(__dirname, '..', '..', '..', 'shared', 'keys'),
        identityProvider: {
          name: 'auth.wolkenkit.io',
          certificate: path.join(__dirname, '..', '..', '..', 'shared', 'keys', 'certificate.pem')
        }
      });

      await appReceiver.commandbus.use(new appReceiver.wires.commandbus.amqp.Receiver({
        url: env.RABBITMQ_URL,
        application: 'Plcr'
      }));

      await appSender.commandbus.use(new appSender.wires.commandbus.amqp.Sender({
        url: env.RABBITMQ_URL,
        application: 'Plcr'
      }));
    });

    test('sends and receives commands.', done => {
      const command = new appSender.Command({
        context: { name: 'Planning' },
        aggregate: { name: 'PeerGroup', id: 'dfa1c416-32e6-431a-8d65-27ba0fc3e978' },
        name: 'Join',
        data: { foo: 'foobar' }
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
      test('emits a disconnect event when the wire has been disconnected.', done => {
        appReceiver.commandbus.incoming.once('disconnect', () => {
          shell.exec('docker start rabbitmq');

          (async () => {
            await waitForRabbitMq();
            done();
          })();
        });

        shell.exec('docker kill rabbitmq');
      });
    });

    suite('outgoing', () => {
      test('emits a disconnect event when the wire has been disconnected.', done => {
        appSender.commandbus.outgoing.once('disconnect', () => {
          shell.exec('docker start rabbitmq');

          (async () => {
            await waitForRabbitMq();
            done();
          })();
        });

        shell.exec('docker kill rabbitmq');
      });
    });
  });
});
