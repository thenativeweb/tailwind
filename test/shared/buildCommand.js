'use strict';

const { Command } = require('commands-events'),
      uuid = require('uuidv4');

const buildCommand = function (contextName, aggregateName, aggregateId, commandName, data) {
  if (!data) {
    data = commandName;
    commandName = aggregateId;
    aggregateId = uuid();
  }

  return new Command({
    context: { name: contextName },
    aggregate: { name: aggregateName, id: aggregateId },
    name: commandName,
    data
  });
};

module.exports = buildCommand;
