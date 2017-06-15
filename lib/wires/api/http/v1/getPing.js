'use strict';

const getPing = function () {
  return function (req, res) {
    res.send({
      api: 'v1'
    });
  };
};

module.exports = getPing;
