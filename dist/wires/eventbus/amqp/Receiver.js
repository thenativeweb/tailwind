'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hase = require('hase'),
    retry = require('async-retry');

var Receiver = function () {
  function Receiver(_ref) {
    var url = _ref.url,
        application = _ref.application;
    (0, _classCallCheck3.default)(this, Receiver);

    if (!url) {
      throw new Error('Url is missing.');
    }
    if (!application) {
      throw new Error('Application is missing.');
    }

    this.url = url;
    this.application = application;
  }

  (0, _createClass3.default)(Receiver, [{
    key: 'link',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(app, incoming, outgoing) {
        var _this = this;

        var logger, mq, readStream;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (app) {
                  _context2.next = 2;
                  break;
                }

                throw new Error('App is missing.');

              case 2:
                if (incoming) {
                  _context2.next = 4;
                  break;
                }

                throw new Error('Incoming is missing.');

              case 4:
                if (outgoing) {
                  _context2.next = 6;
                  break;
                }

                throw new Error('Outgoing is missing.');

              case 6:
                logger = app.services.getLogger();
                mq = void 0;
                _context2.prev = 8;
                _context2.next = 11;
                return retry((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
                  var connection;
                  return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.next = 2;
                          return hase.connect(_this.url);

                        case 2:
                          connection = _context.sent;
                          return _context.abrupt('return', connection);

                        case 4:
                        case 'end':
                          return _context.stop();
                      }
                    }
                  }, _callee, _this);
                })));

              case 11:
                mq = _context2.sent;
                _context2.next = 17;
                break;

              case 14:
                _context2.prev = 14;
                _context2.t0 = _context2['catch'](8);
                return _context2.abrupt('return', incoming.emit('error', _context2.t0));

              case 17:

                mq.on('error', function (err) {
                  incoming.emit('error', err);
                });

                mq.on('disconnect', function () {
                  incoming.emit('disconnect');
                });

                readStream = void 0;
                _context2.prev = 20;
                _context2.next = 23;
                return mq.publisher(this.application + '::events').createReadStream();

              case 23:
                readStream = _context2.sent;
                _context2.next = 29;
                break;

              case 26:
                _context2.prev = 26;
                _context2.t1 = _context2['catch'](20);
                return _context2.abrupt('return', incoming.emit('error', _context2.t1));

              case 29:

                logger.debug('Started eventbus (receiver) endpoint.', {
                  url: this.url, application: this.application
                });

                readStream.on('data', function (message) {
                  var event = void 0;

                  try {
                    event = app.Event.wrap(message.payload);
                  } catch (ex) {
                    logger.warn('Discarding event...', event);

                    return message.discard();
                  }

                  event.next = message.next;
                  event.discard = message.discard;
                  event.defer = message.defer;

                  incoming.write(event);
                });

              case 31:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[8, 14], [20, 26]]);
      }));

      function link(_x, _x2, _x3) {
        return _ref2.apply(this, arguments);
      }

      return link;
    }()
  }]);
  return Receiver;
}();

module.exports = Receiver;