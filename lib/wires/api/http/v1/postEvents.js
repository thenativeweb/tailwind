'use strict';

const jsonLines = require('json-lines'),
      partOf = require('partof');

const ClientMetadata = require('../ClientMetadata');

const postEvents = function (app) {
  const logger = app.services.getLogger();

  return jsonLines(client => {
    const filter = client.req.body || {};

    const sendToClient = async function ({ event, metadata }) {
      if (!partOf(filter, event)) {
        return;
      }

      let processedEvent;

      const clientMetadata = new ClientMetadata({ req: client.req });

      try {
        processedEvent = await app.api.willPublishEvent({
          event,
          metadata: { ...metadata, client: clientMetadata }
        });
      } catch (ex) {
        logger.error('Will publish event failed.', { ex });

        // Ignore the error, and hope that willPublishEvent has proper exception
        // handling and does something reasonable. However, we drop this event
        // here.
        return;
      }

      if (!processedEvent) {
        return;
      }

      client.send(processedEvent);
    };

    let keepSendingEvents = true;

    client.once('connect', async () => {
      for await (const { event, metadata } of app.api.outgoing) {
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
