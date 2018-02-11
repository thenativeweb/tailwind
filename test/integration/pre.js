'use strict';

const shell = require('shelljs');

const waitForRabbitMq = require('../helpers/waitForRabbitMq');

const pre = function (done) {
  (async () => {
    try {
      shell.exec('docker run -d -p 5673:5672 --name rabbitmq rabbitmq:3.6.6-alpine');
      await waitForRabbitMq();

      return done(null);
    } catch (ex) {
      return done(ex);
    }
  })();
};

module.exports = pre;
