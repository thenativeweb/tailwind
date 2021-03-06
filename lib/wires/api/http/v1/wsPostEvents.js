'use strict';

const partOf = require('partof'),
      pEvent = require('p-event');

const ClientMetadata = require('../ClientMetadata'),
      sendMessage = require('./wsSendMessage');

const subscriptions = {};

const postEvents = {
  async subscribe (socket, req, { app, message }) {
    if (!socket) {
      throw new Error('Socket is missing.');
    }
    if (!req) {
      throw new Error('Request is missing.');
    }
    if (!app) {
      throw new Error('App is missing.');
    }
    if (!message) {
      throw new Error('Message is missing.');
    }

    const logger = app.services.getLogger();

    const filter = message.payload ? message.payload.filter || {} : {};

    const sendToClient = async function ({ event, metadata }) {
      if (!partOf(filter, event)) {
        return;
      }

      let preparedEvent;

      const clientMetadata = new ClientMetadata({ req });

      try {
        preparedEvent = await app.api.prepareEventForForwarding({
          event,
          metadata: { ...metadata, client: clientMetadata }
        });
      } catch (ex) {
        logger.error('Prepare event for forwarding failed.', { ex });

        // Ignore the error, and hope that prepareEventForForwarding has proper
        // exception handling and does something reasonable. However, we drop
        // this event here.
        return;
      }

      if (!preparedEvent) {
        return;
      }

      try {
        await sendMessage(socket, { type: 'event', payload: preparedEvent, statusCode: 200, procedureId: message.procedureId });
      } catch (ex) {
        logger.error('Failed to send message.', { ex });
      }
    };

    let keepSendingEvents = true;

    const unsubscribe = function () {
      keepSendingEvents = false;
    };

    subscriptions[socket.uniqueId] = subscriptions[socket.uniqueId] || {};
    subscriptions[socket.uniqueId][message.procedureId] = unsubscribe;

    try {
      await sendMessage(socket, { type: 'subscribedEvents', statusCode: 200, procedureId: message.procedureId });
    } catch (ex) {
      logger.error('Failed to send message.', { ex });
    }

    // We need to keep the api outgoing stream open, even if the client
    // disconnects. Hence we can not use for await of on the stream directly,
    // but need to wrap it in an async iterator that decouples the stream
    // from the consumer.
    const asyncIterator = pEvent.iterator(app.api.outgoing, 'data', {
      resolutionEvents: [ 'end' ]
    });

    for await (const { event, metadata } of asyncIterator) {
      if (!keepSendingEvents) {
        break;
      }

      await sendToClient({ event, metadata });
    }

    try {
      await sendMessage(socket, { type: 'unsubscribedEvents', statusCode: 200, procedureId: message.procedureId });
    } catch (ex) {
      logger.error('Failed to send message.', { ex });
    }
  },

  async unsubscribe (socket, req, { app, message }) {
    if (!socket) {
      throw new Error('Socket is missing.');
    }
    if (!req) {
      throw new Error('Request is missing.');
    }
    if (!app) {
      throw new Error('App is missing.');
    }
    if (!message) {
      throw new Error('Message is missing.');
    }

    if (!subscriptions[socket.uniqueId] || !subscriptions[socket.uniqueId][message.procedureId]) {
      return;
    }

    const unsubscribe = subscriptions[socket.uniqueId][message.procedureId];

    unsubscribe();
  },

  removeAllListenersFor (socket) {
    if (!socket) {
      throw new Error('Socket is missing.');
    }

    if (!subscriptions[socket.uniqueId]) {
      return;
    }

    Object.keys(subscriptions[socket.uniqueId]).forEach(procedureId => {
      const unsubscribe = subscriptions[socket.uniqueId][procedureId];

      unsubscribe();
    });
  }
};

module.exports = postEvents;
