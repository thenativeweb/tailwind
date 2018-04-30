'use strict';

const fs = require('fs'),
      path = require('path');

const appRoot = require('app-root-path'),
      { Command, Event } = require('commands-events'),
      crypto2 = require('crypto2'),
      Datasette = require('datasette'),
      Draht = require('draht'),
      flaschenpost = require('flaschenpost'),
      processenv = require('processenv'),
      Stethoskop = require('stethoskop'),
      Timer = require('timer2');

const IoPort = require('./IoPort');

class TailwindApp {
  constructor ({ identityProvider, profiling }) {
    if (identityProvider) {
      if (!identityProvider.name) {
        throw new Error('Identity provider name is missing.');
      }
      if (!identityProvider.certificate) {
        throw new Error('Identity provider certificate is missing.');
      }
    }

    process.on('uncaughtException', ex => {
      this.fail('Application failed unexpectedly.', ex);
    });
    process.on('unhandledRejection', ex => {
      this.fail('Application failed unexpectedly.', ex);
    });

    this.dirname = appRoot.path;
    this.env = processenv;

    /* eslint-disable global-require */
    this.configuration = require(path.join(this.dirname, 'package.json'));
    /* eslint-enable global-require */
    this.name = this.configuration.name;
    this.version = this.configuration.version;
    this.data = new Datasette();

    flaschenpost.use('host', this.name);

    this.logger = flaschenpost.getLogger();

    this.services = {};
    this.services.bus = new Draht();
    this.services.crypto = crypto2;
    this.services.Datasette = Datasette;
    this.services.Emitter = Draht;
    this.services.getLogger = function (source) {
      return flaschenpost.getLogger(source);
    };
    this.services.stethoskop = new Stethoskop({
      from: {
        application: this.name
      },
      to: {
        host: profiling && profiling.host,
        port: profiling && profiling.port
      },
      enabled: Boolean(profiling && profiling.host)
    });
    this.services.Timer = Timer;

    this.identityProvider = {};
    if (identityProvider) {
      this.identityProvider.name = identityProvider.name;
      /* eslint-disable no-sync */
      this.identityProvider.certificate = fs.readFileSync(identityProvider.certificate, { encoding: 'utf8' });
      /* eslint-enable no-sync */
    }

    this.Command = Command;
    this.Event = Event;

    this.api = new IoPort(this);

    // The read function takes the three parameters modelType, modelName and
    // readOptions.
    this.api.read = async function () {
      throw new Error('Not implemented.');
    };

    this.commandbus = new IoPort(this);
    this.eventbus = new IoPort(this);
    this.flowbus = new IoPort(this);
    this.status = new IoPort(this);

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

    this.wires.status = {};
    this.wires.status.http = {};
    /* eslint-disable global-require*/
    this.wires.status.http.Server = require('./wires/status/http/Server');
    /* eslint-enable global-require*/
  }

  fail (message, err) {
    this.logger.fatal(message, { err });

    // Delay exiting the process to give flaschenpost time to write the log
    // message.
    process.nextTick(() => {
      this.exit(1);
    });
  }

  /* eslint-disable class-methods-use-this, no-process-exit */
  exit (code = 0) {
    process.exit(code);
  }
  /* eslint-enable class-methods-use-this, no-process-exit */
}

module.exports = TailwindApp;
