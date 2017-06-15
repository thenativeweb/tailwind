'use strict';

const Command = require('commands-events').Command;

const sendMessage = require('./wsSendMessage'),
      validateCommand = require('./validateCommand');

const postCommand = {};

postCommand.send = function (socket, options) {
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
  if (!options.writeModel) {
    throw new Error('Write model is missing.');
  }

  const { app, message, writeModel } = options;
  const logger = app.services.getLogger();

  let command = message.payload;
  const token = message.token;

  try {
    validateCommand(command, writeModel);
  } catch (ex) {
    return sendMessage(socket, { type: 'error', statusCode: 400, payload: ex.message, procedureId: message.procedureId }, err => {
      if (err) {
        logger.error('Failed to send message.', { err });
      }
    });
  }

  command = Command.wrap(command);
  command.addToken(token);

  app.api.incoming.write(command);
  sendMessage(socket, { type: 'sentCommand', statusCode: 200, procedureId: message.procedureId }, err => {
    if (err) {
      logger.error('Failed to send message.', { err });
    }
  });
};

module.exports = postCommand;
