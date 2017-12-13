const gitTag = require('./git-tag');
const overrideOption = require('./override-option');

const withVersion = async nextRelease => ({
  ...nextRelease,
  version: await gitTag(nextRelease.version),
});

module.exports = overrideOption('nextRelease', withVersion);
