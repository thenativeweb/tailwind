'use strict';

const hase = require('hase'),
      retry = require('async-retry');

class Sender {
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
      mq = await retry(async () => {
        const { url } = this;

        const connection = await hase.connect({ url });

        return connection;
      });
    } catch (ex) {
      return outgoing.emit('error', ex);
    }

    mq.on('error', err => {
      outgoing.emit('error', err);
    });

    mq.on('disconnect', err => {
      outgoing.emit('disconnect', err);
    });

    let writeStream;

    try {
      writeStream = await mq.worker(`${this.application}::commands`).createWriteStream();
    } catch (ex) {
      return incoming.emit('error', ex);
    }

    logger.debug('Started commandbus (sender) endpoint.', {
      url: this.url, application: this.application
    });

    outgoing.on('data', ({ command, metadata }) => {
      writeStream.write({ command, metadata });
    });
  }
}

module.exports = Sender;
