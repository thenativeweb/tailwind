'use strict';

const processenv = require('processenv'),
      shell = require('shelljs');

const post = function (done) {
  (async () => {
    try {
      if (!processenv('CIRCLECI')) {
        // On CircleCI, we are not allowed to remove Docker containers.
        shell.exec('docker kill rabbitmq; docker rm -v rabbitmq');
      }

      return done(null);
    } catch (ex) {
      return done(ex);
    }
  })();
};

module.exports = post;
