'use strict';

const sendMessage = require('./wsSendMessage'),
      validateQuery = require('./validateQuery');

const subscriptions = {};

const postRead = {};

postRead.subscribe = function (socket, options) {
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
  if (!options.readModel) {
    throw new Error('Read model is missing.');
  }

  const { app, message, readModel } = options;
  const logger = app.services.getLogger();

  if (!message.payload) {
    return sendMessage(socket, {
      type: 'error',
      payload: 'Payload is missing.',
      statusCode: 400,
      procedureId: message.procedureId
    }, err => {
      if (err) {
        logger.error('Failed to send message.', { err });
      }
    });
  }

  const { modelName, modelType, query = {}} = message.payload;
  const { orderBy = {}} = query;
  let { skip = 0, take = 100, where = {}} = query;

  if (typeof skip !== 'number') {
    skip = 0;
  }
  if (typeof take !== 'number') {
    take = 100;
  }

  if (!readModel[modelType]) {
    return sendMessage(socket, {
      type: 'error',
      payload: 'Unknown model type.',
      statusCode: 400,
      procedureId: message.procedureId
    }, err => {
      if (err) {
        logger.error('Failed to send message.', { err });
      }
    });
  }

  if (!readModel[modelType][modelName]) {
    return sendMessage(socket, {
      type: 'error',
      payload: 'Unknown model name.',
      statusCode: 400,
      procedureId: message.procedureId
    }, err => {
      if (err) {
        logger.error('Failed to send message.', { err });
      }
    });
  }

  try {
    validateQuery({ orderBy, skip, take, where });
  } catch (ex) {
    return sendMessage(socket, {
      type: 'error',
      payload: 'Invalid query.',
      statusCode: 400,
      procedureId: message.procedureId
    }, err => {
      if (err) {
        logger.error('Failed to send message.', { err });
      }
    });
  }

  const authenticationWhere = [
    { 'isAuthorized.owner': message.token.sub },
    { 'isAuthorized.forPublic': true }
  ];

  if (message.token.sub !== 'anonymous') {
    authenticationWhere.push({ 'isAuthorized.forAuthenticated': true });
  }

  where = {
    $and: [
      where,
      { $or: authenticationWhere }
    ]
  };

  app.api.read(modelType, modelName, { where, orderBy, take, skip }, (errRead, stream) => {
    if (errRead) {
      return sendMessage(socket, {
        type: 'error',
        payload: 'Unable to load model.',
        statusCode: 500,
        procedureId: message.procedureId
      }, err => {
        if (err) {
          logger.error('Failed to send message.', { err });
        }
      });
    }

    let onData,
        onEnd,
        onError;

    const unsubscribe = function () {
      stream.removeListener('data', onData);
      stream.removeListener('end', onEnd);
      stream.removeListener('error', onError);
      stream.resume();
    };

    subscriptions[socket.uniqueId] = subscriptions[socket.uniqueId] || {};
    subscriptions[socket.uniqueId][message.procedureId] = unsubscribe;

    onData = function (data) {
      sendMessage(socket, { type: 'item', payload: data, statusCode: 200, procedureId: message.procedureId }, err => {
        if (err) {
          logger.error('Failed to send message.', { err });
        }
      });
    };

    onEnd = function () {
      unsubscribe();
      sendMessage(socket, { type: 'finish', statusCode: 200, procedureId: message.procedureId }, err => {
        if (err) {
          logger.error('Failed to send message.', { err });
        }
      });
    };

    onError = function (err) {
      unsubscribe();
      sendMessage(socket, { type: 'error', statusCode: 500, procedureId: message.procedureId, payload: err }, errSendMessage => {
        if (errSendMessage) {
          logger.error('Failed to send message.', { err: errSendMessage });
        }
      });
    };

    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('error', onError);

    sendMessage(socket, { type: 'subscribedRead', statusCode: 200, procedureId: message.procedureId }, err => {
      if (err) {
        logger.error('Failed to send message.', { err });
      }
    });
  });
};

postRead.unsubscribe = function (socket, options) {
  if (!socket) {
    throw new Error('Socket is missing.');
  }
  if (!options) {
    throw new Error('Options are missing.');
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
  sendMessage(socket, { type: 'unsubscribedRead', statusCode: 200, procedureId: message.procedureId }, err => {
    if (err) {
      logger.error('Failed to send message.', { err });
    }
  });
};

postRead.removeAllListenersFor = function (socket) {
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

module.exports = postRead;
