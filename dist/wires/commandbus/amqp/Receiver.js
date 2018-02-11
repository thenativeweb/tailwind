'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var hase = require('hase');

var Receiver = function () {
  function Receiver(_ref) {
    var url = _ref.url,
        application = _ref.application;

    _classCallCheck(this, Receiver);

    if (!url) {
      throw new Error('Url is missing.');
    }
    if (!application) {
      throw new Error('Application is missing.');
    }

    this.url = url;
    this.application = application;
  }

  _createClass(Receiver, [{
    key: 'link',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(app, incoming, outgoing) {
        var logger, mq, readStream;
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
                logger = app.services.getLogger();
                mq = void 0;
                _context.prev = 8;
                _context.next = 11;
                return hase.connect(this.url);

              case 11:
                mq = _context.sent;
                _context.next = 17;
                break;

              case 14:
                _context.prev = 14;
                _context.t0 = _context['catch'](8);
                return _context.abrupt('return', incoming.emit('error', _context.t0));

              case 17:

                mq.on('error', function (err) {
                  incoming.emit('error', err);
                });

                mq.on('disconnect', function () {
                  incoming.emit('disconnect');
                });

                readStream = void 0;
                _context.prev = 20;
                _context.next = 23;
                return mq.worker(this.application + '::commands').createReadStream();

              case 23:
                readStream = _context.sent;
                _context.next = 29;
                break;

              case 26:
                _context.prev = 26;
                _context.t1 = _context['catch'](20);
                return _context.abrupt('return', incoming.emit('error', _context.t1));

              case 29:

                logger.debug('Started commandbus (receiver) endpoint.', {
                  url: this.url, application: this.application
                });

                readStream.on('data', function (message) {
                  var command = void 0;

                  try {
                    command = app.Command.wrap(message.payload);
                  } catch (ex) {
                    logger.warn('Discarding command...', command);

                    return message.discard();
                  }

                  command.next = message.next;
                  command.discard = message.discard;
                  command.defer = message.defer;

                  incoming.write(command);
                });

              case 31:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[8, 14], [20, 26]]);
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