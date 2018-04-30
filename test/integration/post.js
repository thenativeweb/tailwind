'use strict';

const processenv = require('processenv'),
      shell = require('shelljs');

const post = async function () {
  if (!processenv('CIRCLECI')) {
    // On CircleCI, we are not allowed to remove Docker containers.
    shell.exec('docker kill rabbitmq; docker rm -v rabbitmq');
  }
};

module.exports = post;
