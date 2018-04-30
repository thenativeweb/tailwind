'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var sendMessage = require('./wsSendMessage'),
    validateQuery = require('./validateQuery');

var subscriptions = {};

var postRead = {
  subscribe: function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(socket, _ref) {
      var app = _ref.app,
          message = _ref.message,
          readModel = _ref.readModel;

      var logger, _message$payload, modelName, modelType, _message$payload$quer, query, _query$orderBy, orderBy, _query$skip, skip, _query$take, take, _query$where, where, authenticationWhere, stream, onData, onEnd, onError, unsubscribe;

      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (socket) {
                _context4.next = 2;
                break;
              }

              throw new Error('Socket is missing.');

            case 2:
              if (app) {
                _context4.next = 4;
                break;
              }

              throw new Error('App is missing.');

            case 4:
              if (message) {
                _context4.next = 6;
                break;
              }

              throw new Error('Message is missing.');

            case 6:
              if (readModel) {
                _context4.next = 8;
                break;
              }

              throw new Error('Read model is missing.');

            case 8:
              logger = app.services.getLogger();

              if (message.payload) {
                _context4.next = 19;
                break;
              }

              _context4.prev = 10;
              _context4.next = 13;
              return sendMessage(socket, { type: 'error', payload: 'Payload is missing.', statusCode: 400, procedureId: message.procedureId });

            case 13:
              _context4.next = 18;
              break;

            case 15:
              _context4.prev = 15;
              _context4.t0 = _context4['catch'](10);

              logger.error('Failed to send message.', { ex: _context4.t0 });

            case 18:
              return _context4.abrupt('return');

            case 19:
              _message$payload = message.payload, modelName = _message$payload.modelName, modelType = _message$payload.modelType, _message$payload$quer = _message$payload.query, query = _message$payload$quer === undefined ? {} : _message$payload$quer;
              _query$orderBy = query.orderBy, orderBy = _query$orderBy === undefined ? {} : _query$orderBy;
              _query$skip = query.skip, skip = _query$skip === undefined ? 0 : _query$skip, _query$take = query.take, take = _query$take === undefined ? 100 : _query$take, _query$where = query.where, where = _query$where === undefined ? {} : _query$where;


              if (typeof skip !== 'number') {
                skip = 0;
              }
              if (typeof take !== 'number') {
                take = 100;
              }

              if (readModel[modelType]) {
                _context4.next = 34;
                break;
              }

              _context4.prev = 25;
              _context4.next = 28;
              return sendMessage(socket, { type: 'error', payload: 'Unknown model type.', statusCode: 400, procedureId: message.procedureId });

            case 28:
              _context4.next = 33;
              break;

            case 30:
              _context4.prev = 30;
              _context4.t1 = _context4['catch'](25);

              logger.error('Failed to send message.', { ex: _context4.t1 });

            case 33:
              return _context4.abrupt('return');

            case 34:
              if (readModel[modelType][modelName]) {
                _context4.next = 44;
                break;
              }

              _context4.prev = 35;
              _context4.next = 38;
              return sendMessage(socket, { type: 'error', payload: 'Unknown model name.', statusCode: 400, procedureId: message.procedureId });

            case 38:
              _context4.next = 43;
              break;

            case 40:
              _context4.prev = 40;
              _context4.t2 = _context4['catch'](35);

              logger.error('Failed to send message.', { ex: _context4.t2 });

            case 43:
              return _context4.abrupt('return');

            case 44:
              _context4.prev = 44;

              validateQuery({ orderBy: orderBy, skip: skip, take: take, where: where });
              _context4.next = 59;
              break;

            case 48:
              _context4.prev = 48;
              _context4.t3 = _context4['catch'](44);
              _context4.prev = 50;
              _context4.next = 53;
              return sendMessage(socket, { type: 'error', payload: 'Invalid query.', statusCode: 400, procedureId: message.procedureId });

            case 53:
              _context4.next = 58;
              break;

            case 55:
              _context4.prev = 55;
              _context4.t4 = _context4['catch'](50);

              logger.error('Failed to send message.', { exSendMessage: _context4.t4 });

            case 58:
              return _context4.abrupt('return');

            case 59:
              authenticationWhere = [{ 'isAuthorized.owner': message.token.sub }, { 'isAuthorized.forPublic': true }];


              if (message.token.sub !== 'anonymous') {
                authenticationWhere.push({ 'isAuthorized.forAuthenticated': true });
              }

              where = {
                $and: [where, { $or: authenticationWhere }]
              };

              stream = void 0;
              _context4.prev = 63;
              _context4.next = 66;
              return app.api.read(modelType, modelName, { where: where, orderBy: orderBy, take: take, skip: skip });

            case 66:
              stream = _context4.sent;
              _context4.next = 80;
              break;

            case 69:
              _context4.prev = 69;
              _context4.t5 = _context4['catch'](63);
              _context4.prev = 71;
              _context4.next = 74;
              return sendMessage(socket, { type: 'error', payload: 'Unable to load model.', statusCode: 500, procedureId: message.procedureId });

            case 74:
              _context4.next = 79;
              break;

            case 76:
              _context4.prev = 76;
              _context4.t6 = _context4['catch'](71);

              logger.error('Failed to send message.', { exSendMessage: _context4.t6 });

            case 79:
              return _context4.abrupt('return');

            case 80:
              onData = void 0, onEnd = void 0, onError = void 0;

              unsubscribe = function unsubscribe() {
                stream.removeListener('data', onData);
                stream.removeListener('end', onEnd);
                stream.removeListener('error', onError);
                stream.end();
              };

              subscriptions[socket.uniqueId] = subscriptions[socket.uniqueId] || {};
              subscriptions[socket.uniqueId][message.procedureId] = unsubscribe;

              onData = function onData(data) {
                var _this = this;

                (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
                  return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.prev = 0;
                          _context.next = 3;
                          return sendMessage(socket, { type: 'item', payload: data, statusCode: 200, procedureId: message.procedureId });

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
              };

              onEnd = function onEnd() {
                var _this2 = this;

                unsubscribe();
                (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
                  return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          _context2.prev = 0;
                          _context2.next = 3;
                          return sendMessage(socket, { type: 'finish', statusCode: 200, procedureId: message.procedureId });

                        case 3:
                          _context2.next = 8;
                          break;

                        case 5:
                          _context2.prev = 5;
                          _context2.t0 = _context2['catch'](0);

                          logger.error('Failed to send message.', { ex: _context2.t0 });

                        case 8:
                        case 'end':
                          return _context2.stop();
                      }
                    }
                  }, _callee2, _this2, [[0, 5]]);
                }))();
              };

              onError = function onError(err) {
                var _this3 = this;

                unsubscribe();
                (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
                  return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          _context3.prev = 0;
                          _context3.next = 3;
                          return sendMessage(socket, { type: 'error', statusCode: 500, procedureId: message.procedureId, payload: err });

                        case 3:
                          _context3.next = 8;
                          break;

                        case 5:
                          _context3.prev = 5;
                          _context3.t0 = _context3['catch'](0);

                          logger.error('Failed to send message.', { ex: _context3.t0 });

                        case 8:
                        case 'end':
                          return _context3.stop();
                      }
                    }
                  }, _callee3, _this3, [[0, 5]]);
                }))();
              };

              stream.on('data', onData);
              stream.on('end', onEnd);
              stream.on('error', onError);

              _context4.prev = 90;
              _context4.next = 93;
              return sendMessage(socket, { type: 'subscribedRead', statusCode: 200, procedureId: message.procedureId });

            case 93:
              _context4.next = 98;
              break;

            case 95:
              _context4.prev = 95;
              _context4.t7 = _context4['catch'](90);

              logger.error('Failed to send message.', { ex: _context4.t7 });

            case 98:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, this, [[10, 15], [25, 30], [35, 40], [44, 48], [50, 55], [63, 69], [71, 76], [90, 95]]);
    }));

    function subscribe(_x, _x2) {
      return _ref2.apply(this, arguments);
    }

    return subscribe;
  }(),
  unsubscribe: function () {
    var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(socket, _ref6) {
      var app = _ref6.app,
          message = _ref6.message;
      var logger, unsubscribe;
      return _regenerator2.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              if (socket) {
                _context5.next = 2;
                break;
              }

              throw new Error('Socket is missing.');

            case 2:
              if (app) {
                _context5.next = 4;
                break;
              }

              throw new Error('App is missing.');

            case 4:
              if (message) {
                _context5.next = 6;
                break;
              }

              throw new Error('Message is missing.');

            case 6:
              logger = app.services.getLogger();

              if (!(!subscriptions[socket.uniqueId] || !subscriptions[socket.uniqueId][message.procedureId])) {
                _context5.next = 9;
                break;
              }

              return _context5.abrupt('return');

            case 9:
              unsubscribe = subscriptions[socket.uniqueId][message.procedureId];


              unsubscribe();
              _context5.prev = 11;
              _context5.next = 14;
              return sendMessage(socket, { type: 'unsubscribedRead', statusCode: 200, procedureId: message.procedureId });

            case 14:
              _context5.next = 19;
              break;

            case 16:
              _context5.prev = 16;
              _context5.t0 = _context5['catch'](11);

              logger.error('Failed to send message.', { ex: _context5.t0 });

            case 19:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, this, [[11, 16]]);
    }));

    function unsubscribe(_x3, _x4) {
      return _ref7.apply(this, arguments);
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

module.exports = postRead;