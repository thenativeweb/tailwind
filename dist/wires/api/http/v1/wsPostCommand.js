'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Command = require('commands-events').Command;

var sendMessage = require('./wsSendMessage'),
    validateCommand = require('./validateCommand');

var postCommand = {
  send: function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(socket, _ref) {
      var app = _ref.app,
          message = _ref.message,
          writeModel = _ref.writeModel;
      var logger, command, token;
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
              if (writeModel) {
                _context.next = 8;
                break;
              }

              throw new Error('Write model is missing.');

            case 8:
              logger = app.services.getLogger();
              command = message.payload;
              token = message.token;
              _context.prev = 11;

              validateCommand(command, writeModel);
              _context.next = 26;
              break;

            case 15:
              _context.prev = 15;
              _context.t0 = _context['catch'](11);
              _context.prev = 17;
              _context.next = 20;
              return sendMessage(socket, { type: 'error', statusCode: 400, payload: _context.t0.message, procedureId: message.procedureId });

            case 20:
              _context.next = 25;
              break;

            case 22:
              _context.prev = 22;
              _context.t1 = _context['catch'](17);

              logger.error('Failed to send message.', { ex: _context.t0 });

            case 25:
              return _context.abrupt('return');

            case 26:

              command = Command.wrap(command);
              command.addToken(token);

              app.api.incoming.write(command);

              _context.prev = 29;
              _context.next = 32;
              return sendMessage(socket, { type: 'sentCommand', statusCode: 200, procedureId: message.procedureId });

            case 32:
              _context.next = 37;
              break;

            case 34:
              _context.prev = 34;
              _context.t2 = _context['catch'](29);

              logger.error('Failed to send message.', { exSendMessage: _context.t2 });

            case 37:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[11, 15], [17, 22], [29, 34]]);
    }));

    function send(_x, _x2) {
      return _ref2.apply(this, arguments);
    }

    return send;
  }()
};

module.exports = postCommand;