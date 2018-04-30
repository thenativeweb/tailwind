'use strict';

const path = require('path');

const assert = require('assertthat'),
      shell = require('shelljs');

const env = require('../../../shared/env'),
      tailwind = require('../../../../src/tailwind'),
      waitForRabbitMq = require('../../../shared/waitForRabbitMq');

suite('flowbus', () => {
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

      await appReceiver.flowbus.use(new appReceiver.wires.flowbus.amqp.Receiver({
        url: env.RABBITMQ_URL,
        application: 'Plcr'
      }));

      await appSender.flowbus.use(new appSender.wires.flowbus.amqp.Sender({
        url: env.RABBITMQ_URL,
        application: 'Plcr'
      }));
    });

    test('sends and receives events.', done => {
      const event = new appSender.Event({
        context: { name: 'Planning' },
        aggregate: { name: 'PeerGroup', id: 'dfa1c416-32e6-431a-8d65-27ba0fc3e978' },
        name: 'Joined',
        data: { foo: 'foobar' },
        metadata: {
          correlationId: 'bb49053c-66ba-4dd9-8eab-b1f69985248c',
          causationId: 'bb49053c-66ba-4dd9-8eab-b1f69985248c'
        }
      });

      appReceiver.flowbus.incoming.once('data', actual => {
        actual.next();
        assert.that(actual.context.name).is.equalTo(event.context.name);
        assert.that(actual.aggregate.name).is.equalTo(event.aggregate.name);
        assert.that(actual.aggregate.id).is.equalTo(event.aggregate.id);
        assert.that(actual.name).is.equalTo(event.name);
        assert.that(actual.id).is.equalTo(event.id);
        assert.that(actual.data).is.equalTo(event.data);
        assert.that(actual.metadata.correlationId).is.equalTo(event.metadata.correlationId);
        assert.that(actual.metadata.causationId).is.equalTo(event.metadata.causationId);
        done();
      });

      appSender.flowbus.outgoing.write(event);
    });

    suite('incoming', () => {
      test('emits a disconnect event when the wire has been disconnected.', done => {
        appReceiver.flowbus.incoming.once('disconnect', () => {
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
        appSender.flowbus.outgoing.once('disconnect', () => {
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
