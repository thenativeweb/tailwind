'use strict';

const getPing = function () {
  return function (req, res) {
    res.json({ api: 'v1' });
  };
};

module.exports = getPing;
