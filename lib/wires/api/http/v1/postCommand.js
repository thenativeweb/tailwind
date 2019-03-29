'use strict';

const Command = require('commands-events').Command,
      typer = require('content-type');

const ClientMetadata = require('../ClientMetadata'),
      validateCommand = require('./validateCommand');

const postCommand = function (app, { writeModel }) {
  return function (req, res) {
    (async () => {
      let command = req.body,
          contentType;

      try {
        contentType = typer.parse(req);
      } catch (ex) {
        return res.status(415).send('Header content-type must be application/json.');
      }

      if (contentType.type !== 'application/json') {
        return res.status(415).send('Header content-type must be application/json.');
      }

      try {
        validateCommand(command, writeModel);
      } catch (ex) {
        return res.status(400).send(ex.message);
      }

      command = Command.deserialize(command);
      command.addInitiator({ token: req.user });

      const clientMetadata = new ClientMetadata({ req });

      app.api.incoming.write({
        command,
        metadata: { client: clientMetadata }
      });
      res.status(200).end();
    })();
  };
};

module.exports = postCommand;
