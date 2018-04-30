'use strict';

const shell = require('shelljs');

const waitForRabbitMq = require('../shared/waitForRabbitMq');

const pre = async function () {
  shell.exec('docker run -d -p 5673:5672 --name rabbitmq rabbitmq:3.6.6-alpine');
  await waitForRabbitMq();
};

module.exports = pre;
