'use strict';

const jsonLines = require('json-lines'),
      partOf = require('partof');

const postEvents = function (app) {
  return jsonLines(client => {
    const filter = client.req.body || {};

    const sendToClient = async function (event) {
      if (!partOf(filter, event)) {
        return;
      }

      let processedEvent;

      try {
        processedEvent = await app.api.willPublishEvent({ event, token: client.req.user });
      } catch (ex) {
        // Ignore the error, and hope that willPublishEvent has proper exception
        // handling, and does logging.
        return;
      }

      if (!processedEvent) {
        return;
      }

      client.send(processedEvent);
    };

    let keepSendingEvents = true;

    client.once('connect', async () => {
      for await (const data of app.api.outgoing) {
        if (!keepSendingEvents) {
          break;
        }

        await sendToClient(data);
      }
    });

    client.once('disconnect', () => {
      keepSendingEvents = false;
    });
  });
};

module.exports = postEvents;
