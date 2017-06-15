'use strict';

const WebSocket = require('ws');

const sendMessage = function (socket, sendOptions, callback) {
  if (!socket) {
    throw new Error('Socket is missing.');
  }
  if (!sendOptions) {
    throw new Error('Options are missing.');
  }
  if (!sendOptions.type) {
    throw new Error('Type is missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  const { type, payload, statusCode = 200 } = sendOptions;

  const message = {
    type,
    payload,
    statusCode
  };

  if (sendOptions.procedureId) {
    message.procedureId = sendOptions.procedureId;
  }

  if (socket.readyState !== WebSocket.OPEN) {
    return callback(null);
  }

  socket.send(JSON.stringify(message), err => {
    if (err) {
      return callback(err);
    }

    callback(null);
  });
};

module.exports = sendMessage;
