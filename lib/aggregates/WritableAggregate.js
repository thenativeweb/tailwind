'use strict';

const cloneDeep = require('lodash/cloneDeep'),
      { Event } = require('commands-events');

const ReadableAggregate = require('./ReadableAggregate');

class WritableAggregate extends ReadableAggregate {
  constructor ({ writeModel, context, aggregate, command }) {
    if (!writeModel) {
      throw new Error('Write model is missing.');
    }
    if (!context) {
      throw new Error('Context is missing.');
    }
    if (!context.name) {
      throw new Error('Context name is missing.');
    }
    if (!aggregate) {
      throw new Error('Aggregate is missing.');
    }
    if (!aggregate.name) {
      throw new Error('Aggregate name is missing.');
    }
    if (!aggregate.id) {
      throw new Error('Aggregate id is missing.');
    }
    if (!command) {
      throw new Error('Command is missing.');
    }

    super({ writeModel, context, aggregate });

    this.api.forCommands = {};
    this.api.forCommands.id = aggregate.id;
    this.api.forCommands.state = this.api.forReadOnly.state;
    this.api.forCommands.exists = this.api.forReadOnly.exists;

    this.api.forCommands.events = {};
    this.api.forCommands.events.publish = (eventName, data) => {
      if (!eventName) {
        throw new Error('Event name is missing.');
      }
      if (!this.definition.events[eventName]) {
        throw new Error('Unknown event.');
      }

      const event = new Event({
        context: { name: context.name },
        aggregate: { name: aggregate.name, id: aggregate.id },
        name: eventName,
        data,
        metadata: {
          correlationId: command.metadata.correlationId,
          causationId: command.id
        }
      });

      event.addInitiator(command.initiator);
      event.metadata.revision = this.instance.revision + this.instance.uncommittedEvents.length + 1;

      const previousState = cloneDeep(this.api.forCommands.state);

      this.definition.events[event.name].handle(this.api.forEvents, event);

      const state = cloneDeep(this.api.forCommands.state);

      this.instance.uncommittedEvents.push({ event, previousState, state });
    };
  }

  applySnapshot (snapshot) {
    super.applySnapshot(snapshot);
    this.api.forCommands.state = snapshot.state;
  }
}

module.exports = WritableAggregate;
