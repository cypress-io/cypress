const { compose } = require('ramda');

const commitAnalyzer = require('@semantic-release/commit-analyzer');
const releaseNotesGenerator = require('@semantic-release/release-notes-generator');
const { publish } = require('@semantic-release/github');

const gitTag = require('./src/git-tag');

const overrideOption = (key, wrapperFn) => pluginFn => async (pluginConfig, options) => {
  const overriddenValue = await wrapperFn(options[key]);
  return pluginFn(pluginConfig, { ...options, [key]: overriddenValue });
};

const withPackageCommits = overrideOption('commits', require('./src/with-package-commits'));

const withVersion = overrideOption('nextRelease', async nextRelease =>
  ({ ...nextRelease, version: await gitTag(nextRelease.version) })
);

const withGitTag = overrideOption('nextRelease', async nextRelease =>
  ({ ...nextRelease, gitTag: await gitTag(nextRelease.version) })
);

module.exports = {
  analyzeCommits: withPackageCommits(commitAnalyzer),
  generateNotes: compose(withGitTag, withVersion, withPackageCommits)(releaseNotesGenerator),
  publish: withGitTag(publish),
};
