'use strict';

const partOf = require('partof');

const sendMessage = require('./wsSendMessage');

const subscriptions = {};

const postEvents = {};

postEvents.subscribe = function (socket, options) {
  if (!socket) {
    throw new Error('Socket is missing.');
  }
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.app) {
    throw new Error('App is missing.');
  }
  if (!options.message) {
    throw new Error('Message is missing.');
  }

  const { app, message } = options;
  const logger = app.services.getLogger();

  const filter = message.payload ? message.payload.filter || {} : {};

  const sendToClient = function (event) {
    if (!partOf(filter, event)) {
      return;
    }

    if (
      !event.metadata.isAuthorized ||
      event.metadata.isAuthorized.forPublic ||
      (event.metadata.isAuthorized.forAuthenticated && message.token.sub !== 'anonymous') ||
      (event.metadata.isAuthorized.owner === message.token.sub)
    ) {
      sendMessage(socket, { type: 'event', payload: event, statusCode: 200, procedureId: message.procedureId }, err => {
        if (err) {
          logger.error('Failed to send message.', { err });
        }
      });
    }
  };

  const unsubscribe = function () {
    app.api.outgoing.removeListener('data', sendToClient);
  };

  subscriptions[socket.uniqueId] = subscriptions[socket.uniqueId] || {};
  subscriptions[socket.uniqueId][message.procedureId] = unsubscribe;

  app.api.outgoing.on('data', sendToClient);
  sendMessage(socket, { type: 'subscribedEvents', statusCode: 200, procedureId: message.procedureId }, err => {
    if (err) {
      logger.error('Failed to send message.', { err });
    }
  });
};

postEvents.unsubscribe = function (socket, options) {
  if (!socket) {
    throw new Error('Socket is missing.');
  }
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.app) {
    throw new Error('App is missing.');
  }
  if (!options.message) {
    throw new Error('Message is missing.');
  }

  const { app, message } = options;
  const logger = app.services.getLogger();

  if (!subscriptions[socket.uniqueId] || !subscriptions[socket.uniqueId][message.procedureId]) {
    return;
  }

  const unsubscribe = subscriptions[socket.uniqueId][message.procedureId];

  unsubscribe();
  sendMessage(socket, { type: 'unsubscribedEvents', statusCode: 200, procedureId: message.procedureId }, err => {
    if (err) {
      logger.error('Failed to send message.', { err });
    }
  });
};

postEvents.removeAllListenersFor = function (socket) {
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
};

module.exports = postEvents;
