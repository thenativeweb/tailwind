'use strict';

const hase = require('hase');

const Sender = function (options) {
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
        return outgoing.emit('error', errConnect);
      }

      mq.on('error', errMq => {
        outgoing.emit('error', errMq);
      });

      mq.on('disconnect', () => {
        outgoing.emit('disconnect');
      });

      mq.worker(`${options.application}::commands`).createWriteStream((errCreateWriteStream, writeStream) => {
        if (errCreateWriteStream) {
          return incoming.emit('error', errCreateWriteStream);
        }

        logger.debug('Started commandbus (sender) endpoint.', options);

        outgoing.on('data', command => {
          writeStream.write(command);
        });

        callback(null);
      });
    });
  };
};

module.exports = Sender;
