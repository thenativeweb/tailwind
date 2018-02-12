'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var jsonLines = require('json-lines');

var validateQuery = require('./validateQuery');

var postRead = function postRead(app, _ref) {
  var readModel = _ref.readModel;

  return function (req, res) {
    var _this = this;

    (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      var _req$params, modelName, modelType, _req$query, orderBy, skip, take, where, authenticationWhere, stream;

      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _req$params = req.params, modelName = _req$params.modelName, modelType = _req$params.modelType;
              _req$query = req.query, orderBy = _req$query.orderBy, skip = _req$query.skip, take = _req$query.take, where = _req$query.where;

              if (readModel[modelType]) {
                _context.next = 4;
                break;
              }

              return _context.abrupt('return', res.status(400).send('Unknown model type.'));

            case 4:
              if (readModel[modelType][modelName]) {
                _context.next = 6;
                break;
              }

              return _context.abrupt('return', res.status(400).send('Unknown model name.'));

            case 6:
              _context.prev = 6;

              where = where ? JSON.parse(where) : {};
              _context.next = 13;
              break;

            case 10:
              _context.prev = 10;
              _context.t0 = _context['catch'](6);
              return _context.abrupt('return', res.status(400).send('Invalid where.'));

            case 13:
              _context.prev = 13;

              orderBy = orderBy ? JSON.parse(orderBy) : {};
              _context.next = 20;
              break;

            case 17:
              _context.prev = 17;
              _context.t1 = _context['catch'](13);
              return _context.abrupt('return', res.status(400).send('Invalid order by.'));

            case 20:

              skip = !isNaN(skip) ? skip - 0 : 0;
              take = !isNaN(take) ? take - 0 : 100;

              _context.prev = 22;

              validateQuery({ orderBy: orderBy, skip: skip, take: take, where: where });
              _context.next = 29;
              break;

            case 26:
              _context.prev = 26;
              _context.t2 = _context['catch'](22);
              return _context.abrupt('return', res.status(400).send('Invalid query.'));

            case 29:
              authenticationWhere = [{ 'isAuthorized.owner': req.user.sub }, { 'isAuthorized.forPublic': true }];


              if (req.user.sub !== 'anonymous') {
                authenticationWhere.push({ 'isAuthorized.forAuthenticated': true });
              }

              where = {
                $and: [where, { $or: authenticationWhere }]
              };

              stream = void 0;
              _context.prev = 33;
              _context.next = 36;
              return app.api.read(modelType, modelName, { where: where, orderBy: orderBy, take: take, skip: skip });

            case 36:
              stream = _context.sent;
              _context.next = 42;
              break;

            case 39:
              _context.prev = 39;
              _context.t3 = _context['catch'](33);
              return _context.abrupt('return', res.status(500).send('Unable to load model.'));

            case 42:

              jsonLines(function (client) {
                var sendToClient = function sendToClient(data) {
                  client.send(data);
                };

                stream.on('data', sendToClient);

                stream.once('end', function () {
                  stream.removeListener('data', sendToClient);
                  client.disconnect();
                });

                client.once('disconnect', function () {
                  stream.end();
                });
              })(req, res);

            case 43:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this, [[6, 10], [13, 17], [22, 26], [33, 39]]);
    }))();
  };
};

module.exports = postRead;