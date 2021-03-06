'use strict';

const hase = require('hase'),
      retry = require('async-retry');

class Receiver {
  constructor ({ url, application, prefetch }) {
    if (!url) {
      throw new Error('Url is missing.');
    }
    if (!application) {
      throw new Error('Application is missing.');
    }

    this.url = url;
    this.application = application;
    this.prefetch = prefetch;
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
        const { url, prefetch } = this;

        const connection = await hase.connect({ url, prefetch });

        return connection;
      });
    } catch (ex) {
      return incoming.emit('error', ex);
    }

    mq.on('error', errMq => {
      incoming.emit('error', errMq);
    });

    mq.on('disconnect', err => {
      incoming.emit('disconnect', err);
    });

    let readStream;

    try {
      readStream = await mq.worker(`${this.application}::flows`).createReadStream();
    } catch (ex) {
      return incoming.emit('error', ex);
    }

    logger.debug('Started flowbus (receiver) endpoint.', {
      url: this.url, application: this.application
    });

    readStream.on('data', message => {
      const { payload, next, discard, defer } = message;
      const { event, metadata } = payload;

      let deserializedEvent;

      try {
        deserializedEvent = app.Event.deserialize(event);
      } catch (ex) {
        logger.warn('Discarding event...', event);

        return discard();
      }

      incoming.write({
        event: deserializedEvent,
        metadata,
        actions: { next, discard, defer }
      });
    });
  }
}

module.exports = Receiver;
