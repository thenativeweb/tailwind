'use strict';

const jsonLines = require('json-lines');

const ClientMetadata = require('../ClientMetadata'),
      validateQuery = require('./validateQuery');

const postRead = function (app, { readModel }) {
  return async function (req, res) {
    const { modelName, modelType } = req.params;
    let { orderBy, skip, take, where } = req.query;

    if (!readModel[modelType]) {
      return res.status(400).send('Unknown model type.');
    }

    if (!readModel[modelType][modelName]) {
      return res.status(400).send('Unknown model name.');
    }

    try {
      where = where ? JSON.parse(where) : {};
    } catch (ex) {
      return res.status(400).send('Invalid where.');
    }

    try {
      orderBy = orderBy ? JSON.parse(orderBy) : {};
    } catch (ex) {
      return res.status(400).send('Invalid order by.');
    }

    skip = !isNaN(skip) ? skip - 0 : 0;
    take = !isNaN(take) ? take - 0 : 100;

    try {
      validateQuery({ orderBy, skip, take, where });
    } catch (ex) {
      return res.status(400).send('Invalid query.');
    }

    const clientMetadata = new ClientMetadata({ req });

    let stream;

    try {
      stream = await app.api.read({
        modelType,
        modelName,
        metadata: { client: clientMetadata },
        query: { where, orderBy, take, skip }
      });
    } catch (ex) {
      return res.status(500).send('Unable to load model.');
    }

    jsonLines(client => {
      const sendToClient = function (data) {
        client.send(data);
      };

      stream.on('data', sendToClient);

      stream.once('end', () => {
        stream.removeListener('data', sendToClient);
        client.disconnect();
      });

      client.once('disconnect', () => {
        stream.end();
      });
    })(req, res);
  };
};

module.exports = postRead;
