'use strict';

const hase = require('hase');

const Receiver = function (options) {
  this.link = function (app, incoming, outgoing, callback) {
    if (!app) {
      throw new Error('App is missing.');
    }
    if (!incoming) {
      throw new Error('Incoming is missing.');
    }
    if (!outgoing) {
      throw new Error('Outgoing is missing.');
    }
    if (!callback) {
      throw new Error('Callback is missing.');
    }

    const logger = app.services.getLogger();

    hase.connect(options.url, (errConnect, mq) => {
      if (errConnect) {
        return incoming.emit('error', errConnect);
      }

      mq.on('error', errMq => {
        incoming.emit('error', errMq);
      });

      mq.on('disconnect', () => {
        incoming.emit('disconnect');
      });

      mq.worker(`${options.application}::commands`).createReadStream((errCreateReadStream, readStream) => {
        if (errCreateReadStream) {
          return incoming.emit('error', errCreateReadStream);
        }

        logger.debug('Started commandbus (receiver) endpoint.', options);

        readStream.on('data', message => {
          let command;

          try {
            command = app.Command.wrap(message.payload);
          } catch (ex) {
            logger.warn('Discarding command...', command);

            return message.discard();
          }

          command.next = message.next;
          command.discard = message.discard;
          command.defer = message.defer;

          incoming.write(command);
        });

        callback(null);
      });
    });
  };
};

module.exports = Receiver;
