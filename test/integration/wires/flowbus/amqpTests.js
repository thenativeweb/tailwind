'use strict';

const assert = require('assertthat'),
      shell = require('shelljs'),
      uuid = require('uuidv4');

const tailwind = require('../../../../lib/tailwind'),
      waitForRabbitMq = require('../../../shared/waitForRabbitMq');

suite('flowbus', () => {
  suite('amqp', function () {
    this.timeout(20 * 1000);

    let appReceiver,
        appSender;

    setup(async () => {
      appSender = tailwind.createApp();
      appReceiver = tailwind.createApp();

      await appReceiver.flowbus.use(new appReceiver.wires.flowbus.amqp.Receiver({
        url: 'amqp://wolkenkit:wolkenkit@localhost:5672',
        application: 'Plcr'
      }));

      await appSender.flowbus.use(new appSender.wires.flowbus.amqp.Sender({
        url: 'amqp://wolkenkit:wolkenkit@localhost:5672',
        application: 'Plcr'
      }));
    });

    test('sends and receives events.', done => {
      const event = new appSender.Event({
        context: { name: 'Planning' },
        aggregate: { name: 'PeerGroup', id: uuid() },
        name: 'Joined',
        data: { foo: 'foobar' },
        metadata: {
          correlationId: uuid(),
          causationId: uuid()
        }
      });

      const metadata = { foo: 'bar' };

      appReceiver.flowbus.incoming.once('data', message => {
        const receivedEvent = message.event,
              receivedMetadata = message.metadata;

        message.actions.next();

        assert.that(receivedEvent.context.name).is.equalTo(event.context.name);
        assert.that(receivedEvent.aggregate.name).is.equalTo(event.aggregate.name);
        assert.that(receivedEvent.aggregate.id).is.equalTo(event.aggregate.id);
        assert.that(receivedEvent.name).is.equalTo(event.name);
        assert.that(receivedEvent.id).is.equalTo(event.id);
        assert.that(receivedEvent.data).is.equalTo(event.data);
        assert.that(receivedEvent.metadata.correlationId).is.equalTo(event.metadata.correlationId);
        assert.that(receivedEvent.metadata.causationId).is.equalTo(event.metadata.causationId);

        assert.that(receivedMetadata).is.equalTo(metadata);
        done();
      });

      appSender.flowbus.outgoing.write({ event, metadata });
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
