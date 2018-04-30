'use strict';

const hase = require('hase');

class Receiver {
  constructor ({ url, application }) {
    if (!url) {
      throw new Error('Url is missing.');
    }
    if (!application) {
      throw new Error('Application is missing.');
    }

    this.url = url;
    this.application = application;
  }

  async link (app, incoming, outgoing) {
    if (!app) {
      throw new Error('App is missing.');
    }
    if (!incoming) {
      throw new Error('Incoming is missing.');
    }
    if (!outgoing) {
      throw new Error('Outgoing is missing.');
    }

    const logger = app.services.getLogger();

    let mq;

    try {
      mq = await hase.connect(this.url);
    } catch (ex) {
      return incoming.emit('error', ex);
    }

    mq.on('error', err => {
      incoming.emit('error', err);
    });

    mq.on('disconnect', () => {
      incoming.emit('disconnect');
    });

    let readStream;

    try {
      readStream = await mq.worker(`${this.application}::commands`).createReadStream();
    } catch (ex) {
      return incoming.emit('error', ex);
    }

    logger.debug('Started commandbus (receiver) endpoint.', {
      url: this.url, application: this.application
    });

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
  }
}

module.exports = Receiver;
