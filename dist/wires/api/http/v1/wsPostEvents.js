'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var partOf = require('partof');

var sendMessage = require('./wsSendMessage');

var subscriptions = {};

var postEvents = {
  subscribe: function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(socket, _ref) {
      var app = _ref.app,
          message = _ref.message;
      var logger, filter, sendToClient, unsubscribe;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (socket) {
                _context2.next = 2;
                break;
              }

              throw new Error('Socket is missing.');

            case 2:
              if (app) {
                _context2.next = 4;
                break;
              }

              throw new Error('App is missing.');

            case 4:
              if (message) {
                _context2.next = 6;
                break;
              }

              throw new Error('Message is missing.');

            case 6:
              logger = app.services.getLogger();
              filter = message.payload ? message.payload.filter || {} : {};

              sendToClient = function sendToClient(event) {
                var _this = this;

                if (!partOf(filter, event)) {
                  return;
                }

                if (!event.metadata.isAuthorized || event.metadata.isAuthorized.forPublic || event.metadata.isAuthorized.forAuthenticated && message.token.sub !== 'anonymous' || event.metadata.isAuthorized.owner === message.token.sub) {
                  (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
                    return _regenerator2.default.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            _context.prev = 0;
                            _context.next = 3;
                            return sendMessage(socket, { type: 'event', payload: event, statusCode: 200, procedureId: message.procedureId });

                          case 3:
                            _context.next = 8;
                            break;

                          case 5:
                            _context.prev = 5;
                            _context.t0 = _context['catch'](0);

                            logger.error('Failed to send message.', { ex: _context.t0 });

                          case 8:
                          case 'end':
                            return _context.stop();
                        }
                      }
                    }, _callee, _this, [[0, 5]]);
                  }))();
                }
              };

              unsubscribe = function unsubscribe() {
                app.api.outgoing.removeListener('data', sendToClient);
              };

              subscriptions[socket.uniqueId] = subscriptions[socket.uniqueId] || {};
              subscriptions[socket.uniqueId][message.procedureId] = unsubscribe;

              app.api.outgoing.on('data', sendToClient);
              _context2.prev = 13;
              _context2.next = 16;
              return sendMessage(socket, { type: 'subscribedEvents', statusCode: 200, procedureId: message.procedureId });

            case 16:
              _context2.next = 21;
              break;

            case 18:
              _context2.prev = 18;
              _context2.t0 = _context2['catch'](13);

              logger.error('Failed to send message.', { ex: _context2.t0 });

            case 21:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this, [[13, 18]]);
    }));

    function subscribe(_x, _x2) {
      return _ref2.apply(this, arguments);
    }

    return subscribe;
  }(),
  unsubscribe: function () {
    var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(socket, _ref4) {
      var app = _ref4.app,
          message = _ref4.message;
      var logger, unsubscribe;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (socket) {
                _context3.next = 2;
                break;
              }

              throw new Error('Socket is missing.');

            case 2:
              if (app) {
                _context3.next = 4;
                break;
              }

              throw new Error('App is missing.');

            case 4:
              if (message) {
                _context3.next = 6;
                break;
              }

              throw new Error('Message is missing.');

            case 6:
              logger = app.services.getLogger();

              if (!(!subscriptions[socket.uniqueId] || !subscriptions[socket.uniqueId][message.procedureId])) {
                _context3.next = 9;
                break;
              }

              return _context3.abrupt('return');

            case 9:
              unsubscribe = subscriptions[socket.uniqueId][message.procedureId];


              unsubscribe();
              _context3.prev = 11;
              _context3.next = 14;
              return sendMessage(socket, { type: 'unsubscribedEvents', statusCode: 200, procedureId: message.procedureId });

            case 14:
              _context3.next = 19;
              break;

            case 16:
              _context3.prev = 16;
              _context3.t0 = _context3['catch'](11);

              logger.error('Failed to send message.', { ex: _context3.t0 });

            case 19:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this, [[11, 16]]);
    }));

    function unsubscribe(_x3, _x4) {
      return _ref5.apply(this, arguments);
    }

    return unsubscribe;
  }(),
  removeAllListenersFor: function removeAllListenersFor(socket) {
    if (!socket) {
      throw new Error('Socket is missing.');
    }

    if (!subscriptions[socket.uniqueId]) {
      return;
    }

    (0, _keys2.default)(subscriptions[socket.uniqueId]).forEach(function (procedureId) {
      var unsubscribe = subscriptions[socket.uniqueId][procedureId];

      unsubscribe();
    });
  }
};

module.exports = postEvents;