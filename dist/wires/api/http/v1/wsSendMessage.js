'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var WebSocket = require('ws');

var sendMessage = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(socket, _ref2) {
    var type = _ref2.type,
        procedureId = _ref2.procedureId,
        payload = _ref2.payload,
        _ref2$statusCode = _ref2.statusCode,
        statusCode = _ref2$statusCode === undefined ? 200 : _ref2$statusCode;
    var message;
    return regeneratorRuntime.wrap(function _callee$(_context) {
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
            return new Promise(function (resolve, reject) {
              socket.send(JSON.stringify(message), function (err) {
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
    return _ref.apply(this, arguments);
  };
}();

module.exports = sendMessage;