'use strict';

const getConfigurationJson = function (options) {
  return function (req, res) {
    res.send({
      writeModel: options.writeModel,
      readModel: options.readModel
    });
  };
};

module.exports = getConfigurationJson;
