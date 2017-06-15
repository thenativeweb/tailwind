'use strict';

const amqp = require('amqplib/callback_api'),
      retry = require('retry');

const env = require('./env');

const waitForRabbitMq = function (callback) {
  const operation = retry.operation();

  operation.attempt(() => {
    amqp.connect(env.RABBITMQ_URL, {}, (err, connection) => {
      if (operation.retry(err)) {
        return;
      }

      if (err) {
        return callback(operation.mainError());
      }

      connection.close(errClose => {
        if (errClose) {
          return callback(errClose);
        }

        callback(null);
      });
    });
  });
};

module.exports = waitForRabbitMq;
