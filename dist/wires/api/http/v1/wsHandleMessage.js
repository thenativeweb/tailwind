'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var postCommand = require('./wsPostCommand'),
    postEvents = require('./wsPostEvents'),
    postRead = require('./wsPostRead'),
    sendMessage = require('./wsSendMessage');

var handleMessage = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(socket, _ref) {
    var app = _ref.app,
        message = _ref.message,
        readModel = _ref.readModel,
        writeModel = _ref.writeModel;
    var logger;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (socket) {
              _context.next = 2;
              break;
            }

            throw new Error('Socket is missing.');

          case 2:
            if (app) {
              _context.next = 4;
              break;
            }

            throw new Error('App is missing.');

          case 4:
            if (message) {
              _context.next = 6;
              break;
            }

            throw new Error('Message is missing.');

          case 6:
            if (readModel) {
              _context.next = 8;
              break;
            }

            throw new Error('Read model is missing.');

          case 8:
            if (writeModel) {
              _context.next = 10;
              break;
            }

            throw new Error('Write model is missing.');

          case 10:
            logger = app.services.getLogger();
            _context.t0 = message.type;
            _context.next = _context.t0 === 'sendCommand' ? 14 : _context.t0 === 'subscribeEvents' ? 17 : _context.t0 === 'unsubscribeEvents' ? 20 : _context.t0 === 'subscribeRead' ? 23 : _context.t0 === 'unsubscribeRead' ? 26 : 29;
            break;

          case 14:
            _context.next = 16;
            return postCommand.send(socket, { app: app, message: message, writeModel: writeModel });

          case 16:
            return _context.abrupt('break', 37);

          case 17:
            _context.next = 19;
            return postEvents.subscribe(socket, { app: app, message: message });

          case 19:
            return _context.abrupt('break', 37);

          case 20:
            _context.next = 22;
            return postEvents.unsubscribe(socket, { app: app, message: message });

          case 22:
            return _context.abrupt('break', 37);

          case 23:
            _context.next = 25;
            return postRead.subscribe(socket, { app: app, message: message, readModel: readModel });

          case 25:
            return _context.abrupt('break', 37);

          case 26:
            _context.next = 28;
            return postRead.unsubscribe(socket, { app: app, message: message });

          case 28:
            return _context.abrupt('break', 37);

          case 29:
            _context.prev = 29;
            _context.next = 32;
            return sendMessage(socket, { type: 'error', statusCode: 400, payload: 'Bad request.' });

          case 32:
            _context.next = 37;
            break;

          case 34:
            _context.prev = 34;
            _context.t1 = _context['catch'](29);

            logger.error('Failed to send message.', { ex: _context.t1 });

          case 37:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[29, 34]]);
  }));

  return function handleMessage(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = handleMessage;