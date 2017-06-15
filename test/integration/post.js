'use strict';

const processenv = require('processenv'),
      shell = require('shelljs');

const post = function (done) {
  if (processenv('CIRCLECI')) {
    // On CircleCI, we are not allowed to remove Docker containers.
    return done(null);
  }

  shell.exec('docker kill rabbitmq; docker rm -v rabbitmq', done);
};

module.exports = post;
