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

var _require = require('stream'),
    PassThrough = _require.PassThrough;

var IoPort = function () {
  function IoPort(app) {
    (0, _classCallCheck3.default)(this, IoPort);

    if (!app) {
      throw new Error('App is missing.');
    }

    this.app = app;
    this.incoming = new PassThrough({ objectMode: true });
    this.outgoing = new PassThrough({ objectMode: true });
  }

  (0, _createClass3.default)(IoPort, [{
    key: 'use',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(wire) {
        return _regenerator2.default.wrap(function _callee$(_context) {
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