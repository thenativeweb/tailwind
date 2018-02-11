'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('stream'),
    PassThrough = _require.PassThrough;

var IoPort = function () {
  function IoPort(app) {
    _classCallCheck(this, IoPort);

    if (!app) {
      throw new Error('App is missing.');
    }

    this.app = app;
    this.incoming = new PassThrough({ objectMode: true });
    this.outgoing = new PassThrough({ objectMode: true });
  }

  _createClass(IoPort, [{
    key: 'use',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(wire) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (wire) {
                  _context.next = 2;
                  break;
                }

                throw new Error('Wire is missing.');

              case 2:
                _context.next = 4;
                return wire.link(this.app, this.incoming, this.outgoing);

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function use(_x) {
        return _ref.apply(this, arguments);
      }

      return use;
    }()
  }]);

  return IoPort;
}();

module.exports = IoPort;