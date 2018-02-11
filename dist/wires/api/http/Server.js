'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs'),
    path = require('path');

var bodyParser = require('body-parser'),
    cors = require('cors'),
    express = require('express'),
    flaschenpost = require('flaschenpost'),
    flatten = require('lodash/flatten'),
    lusca = require('lusca'),
    morgan = require('morgan'),
    nocache = require('nocache'),
    spdy = require('spdy');

var v1 = require('./v1'),
    wsServer = require('./wsServer');

var Server = function () {
  function Server(_ref) {
    var port = _ref.port,
        keys = _ref.keys,
        corsOrigin = _ref.corsOrigin,
        readModel = _ref.readModel,
        writeModel = _ref.writeModel;

    _classCallCheck(this, Server);

    if (!port) {
      throw new Error('Port is missing.');
    }
    if (!keys) {
      throw new Error('Keys directory is missing.');
    }
    if (!corsOrigin) {
      throw new Error('CORS origin is missing.');
    }

    if (corsOrigin === '*') {
      this.corsOrigin = corsOrigin;
    } else {
      this.corsOrigin = flatten([corsOrigin]);
    }

    try {
      /* eslint-disable no-sync */
      this.privateKey = fs.readFileSync(path.join(keys, 'privateKey.pem'), { encoding: 'utf8' });
      this.certificate = fs.readFileSync(path.join(keys, 'certificate.pem'), { encoding: 'utf8' });
      /* eslint-enable no-sync */
    } catch (ex) {
      throw new Error('Keys could not be loaded.');
    }

    this.port = port;
    this.readModel = readModel;
    this.writeModel = writeModel;
  }

  _createClass(Server, [{
    key: 'link',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(app, incoming, outgoing) {
        var readModel, writeModel, privateKey, certificate, port, logger, api, server;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (app) {
                  _context.next = 2;
                  break;
                }

                throw new Error('App is missing.');

              case 2:
                if (incoming) {
                  _context.next = 4;
                  break;
                }

                throw new Error('Incoming is missing.');

              case 4:
                if (outgoing) {
                  _context.next = 6;
                  break;
                }

                throw new Error('Outgoing is missing.');

              case 6:
                readModel = this.readModel, writeModel = this.writeModel, privateKey = this.privateKey, certificate = this.certificate, port = this.port;
                logger = app.services.getLogger();
                api = express();


                api.use(morgan('tiny', {
                  stream: new flaschenpost.Middleware('debug')
                }));

                api.use(lusca.xframe('DENY'));
                api.use(lusca.xssProtection());

                api.options('*', cors({
                  methods: 'GET,POST',
                  origin: this.corsOrigin,
                  optionsSuccessStatus: 200
                }));
                api.use(cors({
                  methods: 'GET,POST',
                  origin: this.corsOrigin,
                  optionsSuccessStatus: 200
                }));

                api.use(nocache());
                api.use(bodyParser.json({ limit: '100kb' }));

                api.use('/v1', v1(app, { readModel: readModel, writeModel: writeModel }));

                server = spdy.createServer({ key: privateKey, cert: certificate }, api);


                wsServer({ httpServer: server, app: app, readModel: readModel, writeModel: writeModel });

                _context.next = 21;
                return new Promise(function (resolve) {
                  server.listen(port, function () {
                    logger.debug('Started API endpoint.', { port: port });
                    resolve();
                  });
                });

              case 21:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function link(_x, _x2, _x3) {
        return _ref2.apply(this, arguments);
      }

      return link;
    }()
  }]);

  return Server;
}();

module.exports = Server;