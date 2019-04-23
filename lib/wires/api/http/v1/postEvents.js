'use strict';

const jsonLines = require('json-lines'),
      partOf = require('partof'),
      pEvent = require('p-event');

const ClientMetadata = require('../ClientMetadata');

const postEvents = function (app) {
  const logger = app.services.getLogger();

  return jsonLines(client => {
    const filter = client.req.body || {};

    const sendToClient = async function ({ event, metadata }) {
      if (!partOf(filter, event)) {
        return;
      }

      let preparedEvent;

      const clientMetadata = new ClientMetadata({ req: client.req });

      try {
        preparedEvent = await app.api.prepareEventForForwarding({
          event,
          metadata: { ...metadata, client: clientMetadata }
        });
      } catch (ex) {
        logger.error('Prepare event for forwarding failed.', { ex });

        // Ignore the error, and hope that prepareEventForForwarding has proper
        // exception handling and does something reasonable. However, we drop
        // this event here.
        return;
      }

      if (!preparedEvent) {
        return;
      }

      client.send(preparedEvent);
    };

    let keepSendingEvents = true;

    client.once('connect', async () => {
      // We need to keep the api outgoing stream open, even if the client
      // disconnects. Hence we can not use for await of on the stream directly,
      // but need to wrap it in an async iterator that decouples the stream
      // from the consumer.
      const asyncIterator = pEvent.iterator(app.api.outgoing, 'data', {
        resolutionEvents: [ 'end' ]
      });

      for await (const { event, metadata } of asyncIterator) {
        if (!keepSendingEvents) {
          break;
        }

        await sendToClient({ event, metadata });
      }
    });

    client.once('disconnect', () => {
      keepSendingEvents = false;
    });
  });
};

module.exports = postEvents;
