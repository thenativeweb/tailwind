'use strict';

const partOf = require('partof');

const sendMessage = require('./wsSendMessage');

const subscriptions = {};

const postEvents = {
  async subscribe (socket, { app, message }) {
    if (!socket) {
      throw new Error('Socket is missing.');
    }
    if (!app) {
      throw new Error('App is missing.');
    }
    if (!message) {
      throw new Error('Message is missing.');
    }

    const logger = app.services.getLogger();

    const filter = message.payload ? message.payload.filter || {} : {};

    const sendToClient = async function (event) {
      if (!partOf(filter, event)) {
        return;
      }

      let processedEvent;

      try {
        processedEvent = await app.api.willPublishEvent({ event, token: message.token });
      } catch (ex) {
        // Ignore the error, and hope that willPublishEvent has proper exception
        // handling and does something reasonable, such as logging. However, we
        // drop this event here.
        return;
      }

      if (!processedEvent) {
        return;
      }

      try {
        await sendMessage(socket, { type: 'event', payload: processedEvent, statusCode: 200, procedureId: message.procedureId });
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

    for await (const data of app.api.outgoing) {
      if (!keepSendingEvents) {
        break;
      }

      await sendToClient(data);
    }

    try {
      await sendMessage(socket, { type: 'unsubscribedEvents', statusCode: 200, procedureId: message.procedureId });
    } catch (ex) {
      logger.error('Failed to send message.', { ex });
    }
  },

  async unsubscribe (socket, { app, message }) {
    if (!socket) {
      throw new Error('Socket is missing.');
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
