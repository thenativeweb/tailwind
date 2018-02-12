'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs'),
    path = require('path');

var appRoot = require('app-root-path'),
    _require = require('commands-events'),
    Command = _require.Command,
    Event = _require.Event,
    crypto2 = require('crypto2'),
    Datasette = require('datasette'),
    Draht = require('draht'),
    flaschenpost = require('flaschenpost'),
    processenv = require('processenv'),
    Stethoskop = require('stethoskop'),
    Timer = require('timer2');


var IoPort = require('./IoPort');

var TailwindApp = function () {
  function TailwindApp(_ref) {
    var _this = this;

    var identityProvider = _ref.identityProvider,
        profiling = _ref.profiling;

    _classCallCheck(this, TailwindApp);

    if (identityProvider) {
      if (!identityProvider.name) {
        throw new Error('Identity provider name is missing.');
      }
      if (!identityProvider.certificate) {
        throw new Error('Identity provider certificate is missing.');
      }
    }

    process.on('uncaughtException', function (ex) {
      _this.fail('Application failed unexpectedly.', ex);
    });
    process.on('unhandledRejection', function (ex) {
      _this.fail('Application failed unexpectedly.', ex);
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
    this.api.read = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              throw new Error('Not implemented.');

            case 1:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    this.commandbus = new IoPort(this);
    this.eventbus = new IoPort(this);
    this.flowbus = new IoPort(this);

    this.api.outgoing.on('data', function () {
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
  }

  _createClass(TailwindApp, [{
    key: 'fail',
    value: function fail(message, err) {
      var _this2 = this;

      this.logger.fatal(message, { err: err });

      // Delay exiting the process to give flaschenpost time to write the log
      // message.
      process.nextTick(function () {
        _this2.exit(1);
      });
    }

    /* eslint-disable class-methods-use-this, no-process-exit */

  }, {
    key: 'exit',
    value: function exit() {
      var code = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      process.exit(code);
    }
    /* eslint-enable class-methods-use-this, no-process-exit */

  }]);

  return TailwindApp;
}();

module.exports = TailwindApp;