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

      mq.publisher(`${options.application}::events`).createReadStream((errCreateReadStream, readStream) => {
        if (errCreateReadStream) {
          return incoming.emit('error', errCreateReadStream);
        }

        logger.debug('Started eventbus (receiver) endpoint.', options);

        readStream.on('data', message => {
          let event;

          try {
            event = app.Event.wrap(message.payload);
          } catch (ex) {
            logger.warn('Discarding event...', event);

            return message.discard();
          }

          event.next = message.next;
          event.discard = message.discard;
          event.defer = message.defer;

          incoming.write(event);
        });

        callback(null);
      });
    });
  };
};

module.exports = Receiver;
