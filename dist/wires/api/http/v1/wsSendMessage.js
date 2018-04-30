'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WebSocket = require('ws');

var sendMessage = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(socket, _ref) {
    var type = _ref.type,
        procedureId = _ref.procedureId,
        payload = _ref.payload,
        _ref$statusCode = _ref.statusCode,
        statusCode = _ref$statusCode === undefined ? 200 : _ref$statusCode;
    var message;
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
            if (type) {
              _context.next = 4;
              break;
            }

            throw new Error('Type is missing.');

          case 4:
            message = { type: type, payload: payload, statusCode: statusCode };


            if (procedureId) {
              message.procedureId = procedureId;
            }

            if (!(socket.readyState !== WebSocket.OPEN)) {
              _context.next = 8;
              break;
            }

            return _context.abrupt('return');

          case 8:
            _context.next = 10;
            return new _promise2.default(function (resolve, reject) {
              socket.send((0, _stringify2.default)(message), function (err) {
                if (err) {
                  return reject(err);
                }

                resolve();
              });
            });

          case 10:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function sendMessage(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = sendMessage;