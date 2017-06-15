'use strict';

const postCommand = require('./wsPostCommand'),
      postEvents = require('./wsPostEvents'),
      postRead = require('./wsPostRead'),
      sendMessage = require('./wsSendMessage');

const handleMessage = function (socket, options) {
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
  if (!options.writeModel) {
    throw new Error('Write model is missing.');
  }

  const { app, message, readModel, writeModel } = options;
  const logger = app.services.getLogger();

  switch (message.type) {
    case 'sendCommand':
      postCommand.send(socket, { app, message, writeModel });
      break;
    case 'subscribeEvents':
      postEvents.subscribe(socket, { app, message });
      break;
    case 'unsubscribeEvents':
      postEvents.unsubscribe(socket, { app, message });
      break;
    case 'subscribeRead':
      postRead.subscribe(socket, { app, message, readModel });
      break;
    case 'unsubscribeRead':
      postRead.unsubscribe(socket, { app, message });
      break;
    default:
      sendMessage(socket, { type: 'error', statusCode: 400, payload: 'Bad request.' }, err => {
        if (err) {
          logger.error('Failed to send message.', { err });
        }
      });
  }
};

module.exports = handleMessage;
