'use strict';

const Limes = require('limes'),
      uuid = require('uuidv4'),
      WebSocket = require('ws');

const v1 = require('./v1/wsIndex');

const wsServer = function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.app) {
    throw new Error('App is missing.');
  }
  if (!options.httpServer) {
    throw new Error('Http server is missing.');
  }
  if (!options.readModel) {
    throw new Error('Read model is missing.');
  }
  if (!options.writeModel) {
    throw new Error('Write model is missing.');
  }

  const { app, httpServer, readModel, writeModel } = options;
  const logger = app.services.getLogger();

  const webSocketServer = new WebSocket.Server({ server: httpServer });

  const limes = new Limes({
    identityProviderName: app.identityProvider.name,
    certificate: app.identityProvider.certificate
  });

  webSocketServer.on('connection', socket => {
    // Currently, sockets do not have a unique identifier. That's why we make up
    // our own here. To avoid overwriting a future uniqueId property we have an
    // additional sanity check here.
    if (socket.uniqueId) {
      throw new Error('Sockets now have a uniqueId property by default.');
    }
    socket.uniqueId = uuid();

    const onMessage = function (data) {
      let message;

      try {
        message = JSON.parse(data);
      } catch (ex) {
        // As we could not parse the message sent by the client, we can not
        // dynamically decide which API version to use, so stick to V1 as
        // default here.
        return v1.sendMessage(socket, { type: 'error', statusCode: 400, payload: 'Bad request.' }, err => {
          if (err) {
            logger.error('Failed to send message.', { err });
          }
        });
      }

      let api;

      switch (message.version) {
        case 'v1':
          api = v1;
          break;
        default:
          // As we do not get a valid version from the client, we can not
          // dynamically decide which API version to use, so stick to V1 as
          // default here.
          return v1.sendMessage(socket, { type: 'error', statusCode: 400, payload: 'Bad request.' }, err => {
            if (err) {
              logger.error('Failed to send message.', { err });
            }
          });
      }

      if (!message.procedureId) {
        return api.sendMessage(socket, { type: 'error', statusCode: 400, payload: 'Procedure id is missing.' }, err => {
          if (err) {
            logger.error('Failed to send message.', { err });
          }
        });
      }
      if (!uuid.is(message.procedureId)) {
        return api.sendMessage(socket, { type: 'error', statusCode: 400, payload: 'Procedure id is invalid.' }, err => {
          if (err) {
            logger.error('Failed to send message.', { err });
          }
        });
      }

      if (!message.token) {
        message.token = limes.issueDecodedTokenForAnonymous({
          payloadWhenAnonymous: {}
        });

        api.handleMessage(socket, { app, message, readModel, writeModel });
      } else {
        limes.verifyToken(message.token, (errVerifyToken, decodedToken) => {
          if (errVerifyToken) {
            return api.sendMessage(socket, { type: 'error', statusCode: 401, payload: 'Invalid token.', procedureId: message.procedureId }, err => {
              if (err) {
                logger.error('Failed to send message.', { err });
              }
            });
          }

          message.token = decodedToken;

          api.handleMessage(socket, { app, message, readModel, writeModel });
        });
      }
    };

    const onClose = function () {
      v1.postEvents.removeAllListenersFor(socket);
      v1.postRead.removeAllListenersFor(socket);

      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('close', onClose);
    };

    socket.on('close', onClose);
    socket.on('message', onMessage);
  });
};

module.exports = wsServer;
