'use strict';

const fs = require('fs'),
      path = require('path');

const Limes = require('limes');

const limes = new Limes({
  identityProviderName: 'auth.wolkenkit.io',
  /* eslint-disable no-sync */
  privateKey: fs.readFileSync(path.join(__dirname, 'keys', 'privateKey.pem')),
  certificate: fs.readFileSync(path.join(__dirname, 'keys', 'certificate.pem'))
  /* eslint-enable no-sync */
});

const issueToken = function (subject, payload) {
  return limes.issueTokenFor(subject, payload);
};

module.exports = issueToken;
