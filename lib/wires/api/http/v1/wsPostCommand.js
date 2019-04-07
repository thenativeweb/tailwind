'use strict';

const Command = require('commands-events').Command;

const ClientMetadata = require('../ClientMetadata'),
      sendMessage = require('./wsSendMessage'),
      validateCommand = require('./validateCommand');

const postCommand = {
  async send (socket, req, { app, message, writeModel }) {
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
    if (!writeModel) {
      throw new Error('Write model is missing.');
    }

    const logger = app.services.getLogger();

    let command = message.payload;
    const token = message.token;

    try {
      validateCommand(command, writeModel);
    } catch (ex) {
      try {
        await sendMessage(socket, { type: 'error', statusCode: 400, payload: ex.message, procedureId: message.procedureId });
      } catch (exSendMessage) {
        logger.error('Failed to send message.', { ex });
      }

      return;
    }

    command = Command.deserialize(command);
    command.addInitiator({ token });

    console.log('###### 1', JSON.stringify(req.user, null, 2));

    const clientMetadata = new ClientMetadata({ req });

    console.log('###### 2', JSON.stringify(clientMetadata, null, 2));

    app.api.incoming.write({
      command,
      metadata: { client: clientMetadata }
    });

    try {
      await sendMessage(socket, { type: 'sentCommand', statusCode: 200, procedureId: message.procedureId });
    } catch (exSendMessage) {
      logger.error('Failed to send message.', { exSendMessage });
    }
  }
};

module.exports = postCommand;
