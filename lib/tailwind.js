'use strict';

const TailwindApp = require('./TailwindApp');

let tailwindApp;

const tailwind = {};

tailwind.createApp = function (options) {
  tailwindApp = new TailwindApp(options);

  return tailwindApp;
};

tailwind.app = function () {
  if (!tailwindApp) {
    throw new Error('Application has not been created.');
  }

  return tailwindApp;
};

tailwind.destroyApp = function () {
  tailwindApp = undefined;
};

module.exports = tailwind;
