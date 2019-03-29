'use strict';

const assert = require('assertthat'),
      shell = require('shelljs'),
      uuid = require('uuidv4');

const tailwind = require('../../../../lib/tailwind'),
      waitForRabbitMq = require('../../../shared/waitForRabbitMq');

suite('commandbus', () => {
  suite('amqp', function () {
    this.timeout(20 * 1000);

    let appReceiver,
        appSender;

    setup(async () => {
      appSender = tailwind.createApp();
      appReceiver = tailwind.createApp();

      await appReceiver.commandbus.use(new appReceiver.wires.commandbus.amqp.Receiver({
        url: 'amqp://wolkenkit:wolkenkit@localhost:5672',
        application: 'Plcr'
      }));

      await appSender.commandbus.use(new appSender.wires.commandbus.amqp.Sender({
        url: 'amqp://wolkenkit:wolkenkit@localhost:5672',
        application: 'Plcr'
      }));
    });

    test('sends and receives commands.', done => {
      const command = new appSender.Command({
        context: { name: 'Planning' },
        aggregate: { name: 'PeerGroup', id: uuid() },
        name: 'Join',
        data: { foo: 'foobar' }
      });

      const metadata = { foo: 'bar' };

      appReceiver.commandbus.incoming.once('data', message => {
        const receivedCommand = message.command,
              receivedMetadata = message.metadata;

        message.actions.next();

        assert.that(receivedCommand.context.name).is.equalTo(command.context.name);
        assert.that(receivedCommand.aggregate.name).is.equalTo(command.aggregate.name);
        assert.that(receivedCommand.aggregate.id).is.equalTo(command.aggregate.id);
        assert.that(receivedCommand.name).is.equalTo(command.name);
        assert.that(receivedCommand.id).is.equalTo(command.id);
        assert.that(receivedCommand.data).is.equalTo(command.data);
        assert.that(receivedCommand.metadata.correlationId).is.equalTo(command.metadata.correlationId);
        assert.that(receivedCommand.metadata.causationId).is.equalTo(command.metadata.causationId);
        assert.that(receivedCommand.metadata.timestamp).is.equalTo(command.metadata.timestamp);

        assert.that(receivedMetadata).is.equalTo(metadata);
        done();
      });

      appSender.commandbus.outgoing.write({ command, metadata });
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
