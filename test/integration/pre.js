'use strict';

const shell = require('shelljs');

const waitForRabbitMq = require('../helpers/waitForRabbitMq');

const pre = function (done) {
  shell.exec('docker run -d -p 5673:5672 --name rabbitmq rabbitmq:3.6.6-alpine', errExec => {
    if (errExec) {
      return done(errExec);
    }
    waitForRabbitMq(done);
  });
};

module.exports = pre;
