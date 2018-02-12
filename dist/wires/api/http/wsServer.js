'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Limes = require('limes'),
    uuid = require('uuidv4'),
    WebSocket = require('ws');

var v1 = require('./v1/wsIndex');

var wsServer = function wsServer(_ref) {
  var app = _ref.app,
      httpServer = _ref.httpServer,
      readModel = _ref.readModel,
      writeModel = _ref.writeModel;

  if (!app) {
    throw new Error('App is missing.');
  }
  if (!httpServer) {
    throw new Error('Http server is missing.');
  }
  if (!readModel) {
    throw new Error('Read model is missing.');
  }
  if (!writeModel) {
    throw new Error('Write model is missing.');
  }

  var logger = app.services.getLogger();

  var webSocketServer = new WebSocket.Server({ server: httpServer });

  var limes = new Limes({
    identityProviderName: app.identityProvider.name,
    certificate: app.identityProvider.certificate
  });

  webSocketServer.on('connection', function (socket) {
    // Currently, sockets do not have a unique identifier. That's why we make up
    // our own here. To avoid overwriting a future uniqueId property we have an
    // additional sanity check here.
    if (socket.uniqueId) {
      throw new Error('Sockets now have a uniqueId property by default.');
    }
    socket.uniqueId = uuid();

    var onMessage = function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(data) {
        var message, api, decodedToken;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                message = void 0;
                _context.prev = 1;

                message = JSON.parse(data);
                _context.next = 16;
                break;

              case 5:
                _context.prev = 5;
                _context.t0 = _context['catch'](1);
                _context.prev = 7;
                _context.next = 10;
                return v1.sendMessage(socket, { type: 'error', statusCode: 400, payload: 'Bad request.' });

              case 10:
                _context.next = 15;
                break;

              case 12:
                _context.prev = 12;
                _context.t1 = _context['catch'](7);

                logger.error('Failed to send message.', { exSendMessage: _context.t1 });

              case 15:
                return _context.abrupt('return');

              case 16:
                api = void 0;
                _context.t2 = message.version;
                _context.next = _context.t2 === 'v1' ? 20 : 22;
                break;

              case 20:
                api = v1;
                return _context.abrupt('break', 31);

              case 22:
                _context.prev = 22;
                _context.next = 25;
                return v1.sendMessage(socket, { type: 'error', statusCode: 400, payload: 'Bad request.' });

              case 25:
                _context.next = 30;
                break;

              case 27:
                _context.prev = 27;
                _context.t3 = _context['catch'](22);

                logger.error('Failed to send message.', { ex: _context.t3 });

              case 30:
                return _context.abrupt('return');

              case 31:
                if (message.procedureId) {
                  _context.next = 41;
                  break;
                }

                _context.prev = 32;
                _context.next = 35;
                return api.sendMessage(socket, { type: 'error', statusCode: 400, payload: 'Procedure id is missing.' });

              case 35:
                _context.next = 40;
                break;

              case 37:
                _context.prev = 37;
                _context.t4 = _context['catch'](32);

                logger.error('Failed to send message.', { ex: _context.t4 });

              case 40:
                return _context.abrupt('return');

              case 41:
                if (uuid.is(message.procedureId)) {
                  _context.next = 51;
                  break;
                }

                _context.prev = 42;
                _context.next = 45;
                return api.sendMessage(socket, { type: 'error', statusCode: 400, payload: 'Procedure id is invalid.' });

              case 45:
                _context.next = 50;
                break;

              case 47:
                _context.prev = 47;
                _context.t5 = _context['catch'](42);

                logger.error('Failed to send message.', { ex: _context.t5 });

              case 50:
                return _context.abrupt('return');

              case 51:
                if (message.token) {
                  _context.next = 57;
                  break;
                }

                message.token = limes.issueDecodedTokenForAnonymous({
                  payloadWhenAnonymous: {}
                });

                _context.next = 55;
                return api.handleMessage(socket, { app: app, message: message, readModel: readModel, writeModel: writeModel });

              case 55:
                _context.next = 78;
                break;

              case 57:
                decodedToken = void 0;
                _context.prev = 58;
                _context.next = 61;
                return limes.verifyToken(message.token);

              case 61:
                decodedToken = _context.sent;
                _context.next = 75;
                break;

              case 64:
                _context.prev = 64;
                _context.t6 = _context['catch'](58);
                _context.prev = 66;
                _context.next = 69;
                return api.sendMessage(socket, { type: 'error', statusCode: 401, payload: 'Invalid token.', procedureId: message.procedureId });

              case 69:
                _context.next = 74;
                break;

              case 71:
                _context.prev = 71;
                _context.t7 = _context['catch'](66);

                logger.error('Failed to send message.', { exSendMessage: _context.t7 });

              case 74:
                return _context.abrupt('return');

              case 75:

                message.token = decodedToken;

                _context.next = 78;
                return api.handleMessage(socket, { app: app, message: message, readModel: readModel, writeModel: writeModel });

              case 78:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[1, 5], [7, 12], [22, 27], [32, 37], [42, 47], [58, 64], [66, 71]]);
      }));

      return function onMessage(_x) {
        return _ref2.apply(this, arguments);
      };
    }();

    var onClose = function onClose() {
      v1.postEvents.removeAllListenersFor(socket);
      v1.postRead.removeAllListenersFor(socket);

      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('close', onClose);
    };

    socket.on('close', onClose);
    socket.on('message', onMessage);
  });
};

module.exports = wsServer;