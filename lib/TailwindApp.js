'use strict';

const fs = require('fs'),
      path = require('path');

const _ = require('lodash'),
      appRoot = require('app-root-path'),
      async = require('async'),
      crypto2 = require('crypto2'),
      datasette = require('datasette'),
      draht = require('draht'),
      flaschenpost = require('flaschenpost'),
      processEnv = require('processenv'),
      Stethoskop = require('stethoskop'),
      Timer = require('timer2');

const Command = require('commands-events').Command,
      Event = require('commands-events').Event;

const IoPort = require('./IoPort');

const TailwindApp = function (options) {
  if (options && options.identityProvider) {
    if (!options.identityProvider.name) {
      throw new Error('Identity provider name is missing.');
    }
    if (!options.identityProvider.certificate) {
      throw new Error('Identity provider certificate is missing.');
    }
  }

  this.options = options;

  this.dirname = appRoot.path;
  this.env = processEnv;

  /* eslint-disable global-require */
  this.configuration = require(path.join(this.dirname, 'package.json'));
  /* eslint-enable global-require */
  this.name = this.configuration.name;
  this.version = this.configuration.version;
  this.data = datasette.create();

  flaschenpost.use('host', this.name);

  const logger = flaschenpost.getLogger();

  this.services = {};
  this.services.bus = draht.create();
  this.services.crypto = crypto2;
  this.services.datasette = datasette;
  this.services.emitter = draht;
  this.services.getLogger = function (source) {
    return flaschenpost.getLogger(source);
  };
  this.services.stethoskop = new Stethoskop({
    from: {
      application: this.name
    },
    to: {
      host: options && options.profiling && options.profiling.host,
      port: options && options.profiling && options.profiling.port
    },
    enabled: Boolean(options && options.profiling && options.profiling.host)
  });
  this.services.Timer = Timer;

  this.identityProvider = {};
  if (options && options.identityProvider) {
    this.identityProvider.name = options.identityProvider.name;
    /* eslint-disable no-sync */
    this.identityProvider.certificate = fs.readFileSync(options.identityProvider.certificate, { encoding: 'utf8' });
    /* eslint-enable no-sync */
  }

  this.Command = Command;
  this.Event = Event;

  this.api = new IoPort(this);
  this.api.read = function (modelType, modelName, readOptions, callback) {
    callback(new Error('Not implemented.'));
  };

  this.commandbus = new IoPort(this);
  this.eventbus = new IoPort(this);
  this.flowbus = new IoPort(this);

  this.api.outgoing.on('data', () => {
    // Register an empty event handler to avoid that outgoing data stacks up
    // if no client is connected. In contrast to the other IO ports it is a
    // valid scenario for the API port that no client is connected. Hence,
    // simply consume potential data and throw it away.
  });

  this.wires = {};

  this.wires.api = {};
  this.wires.api.http = {};
  /* eslint-disable global-require*/
  this.wires.api.http.Server = require('./wires/api/http/Server');
  /* eslint-enable global-require*/

  this.wires.commandbus = {};
  this.wires.commandbus.amqp = {};
  /* eslint-disable global-require*/
  this.wires.commandbus.amqp.Receiver = require('./wires/commandbus/amqp/Receiver');
  this.wires.commandbus.amqp.Sender = require('./wires/commandbus/amqp/Sender');
  /* eslint-enable global-require*/

  this.wires.eventbus = {};
  this.wires.eventbus.amqp = {};
  /* eslint-disable global-require*/
  this.wires.eventbus.amqp.Receiver = require('./wires/eventbus/amqp/Receiver');
  this.wires.eventbus.amqp.Sender = require('./wires/eventbus/amqp/Sender');
  /* eslint-enable global-require*/

  this.wires.flowbus = {};
  this.wires.flowbus.amqp = {};
  /* eslint-disable global-require*/
  this.wires.flowbus.amqp.Receiver = require('./wires/flowbus/amqp/Receiver');
  this.wires.flowbus.amqp.Sender = require('./wires/flowbus/amqp/Sender');
  /* eslint-enable global-require*/

  this.exit = process.exit;

  this.fail = function (message, err) {
    logger.fatal(message, { err });

    // Delay exiting the process to give flaschenpost time to write the log
    // message.
    process.nextTick(() => {
      this.exit(1);
    });
  };

  this.run = function (tasks) {
    if (!tasks) {
      throw new Error('Tasks are missing.');
    }

    tasks = _.flatten([ tasks ]);

    const core = tasks.pop();

    async.series(tasks, err => {
      if (err) {
        return this.fail('Failed to initialize application.', err);
      }

      logger.info('Running application.');
      core();
    });
  };

  process.on('uncaughtException', err => {
    this.fail('Application failed unexpectedly.', err);
  });
};

module.exports = TailwindApp;
