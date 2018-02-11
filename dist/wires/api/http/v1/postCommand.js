'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var Command = require('commands-events').Command,
    typer = require('media-typer');

var validateCommand = require('./validateCommand');

var postCommand = function postCommand(app, _ref) {
  var writeModel = _ref.writeModel;

  return function (req, res) {
    var _this = this;

    _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var command, contentType;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              command = req.body, contentType = void 0;
              _context.prev = 1;

              contentType = typer.parse(req);
              _context.next = 8;
              break;

            case 5:
              _context.prev = 5;
              _context.t0 = _context['catch'](1);
              return _context.abrupt('return', res.status(415).send('Header content-type must be application/json.'));

            case 8:
              if (!(contentType.type !== 'application' || contentType.subtype !== 'json')) {
                _context.next = 10;
                break;
              }

              return _context.abrupt('return', res.status(415).send('Header content-type must be application/json.'));

            case 10:
              _context.prev = 10;

              validateCommand(command, writeModel);
              _context.next = 17;
              break;

            case 14:
              _context.prev = 14;
              _context.t1 = _context['catch'](10);
              return _context.abrupt('return', res.status(400).send(_context.t1.message));

            case 17:

              command = Command.wrap(command);
              command.addToken(req.user);

              app.api.incoming.write(command);
              res.status(200).end();

            case 21:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this, [[1, 5], [10, 14]]);
    }))();
  };
};

module.exports = postCommand;