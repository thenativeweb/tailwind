'use strict';

const stream = require('stream');

const PassThrough = stream.PassThrough;

const IoPort = function (app) {
  if (!app) {
    throw new Error('App is missing.');
  }

  this.incoming = new PassThrough({ objectMode: true });
  this.outgoing = new PassThrough({ objectMode: true });

  this.use = function (wire, callback) {
    if (!wire) {
      throw new Error('Wire is missing.');
    }
    if (!callback) {
      throw new Error('Callback is missing.');
    }

    wire.link(app, this.incoming, this.outgoing, callback);
  };
};

module.exports = IoPort;
