'use strict';

const assert = require('assertthat');

const validateQuery = require('../../../../../../lib/wires/api/http/v1/validateQuery');

suite('validateQuery', () => {
  test('is a function.', done => {
    assert.that(validateQuery).is.ofType('function');
    done();
  });

  test('throws an error if query is missing.', done => {
    assert.that(() => {
      validateQuery();
    }).is.throwing('Query is missing.');
    done();
  });

  suite('orderBy', () => {
    test('is valid when value of orderBy is asc, ascending, desc or descending.', done => {
      assert.that(() => {
        validateQuery({
          orderBy: {
            foo: 'asc',
            bar: 'ascending',
            baz: 'desc',
            bas: 'descending'
          }
        });
      }).is.not.throwing();
      done();
    });

    test('is invalid when value of orderBy is not asc, ascending, desc or descending.', done => {
      assert.that(() => {
        validateQuery({
          orderBy: {
            foo: 'invalid-criteria'
          }
        });
      }).is.throwing('Invalid query.');
      done();
    });
  });
});
