'use strict';

const env = {
  /* eslint-disable no-process-env */
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://local.wolkenkit.io:5673'
  /* eslint-enable no-process-env */
};

module.exports = env;
