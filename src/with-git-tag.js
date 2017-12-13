const gitTag = require('./git-tag');
const overrideOption = require('./override-option');

const withGitTag = async nextRelease => ({
  ...nextRelease,
  gitTag: await gitTag(nextRelease.version),
});

module.exports = overrideOption('nextRelease', withGitTag);
