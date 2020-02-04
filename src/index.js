const readPkg = require('read-pkg');
const { compose } = require('ramda');
const withOnlyPackageCommits = require('./only-package-commits');
const versionToGitTag = require('./version-to-git-tag');
const logPluginVersion = require('./log-plugin-version');
const { wrapStep } = require('semantic-release-plugin-decorators');

const {
  mapNextReleaseVersion,
  withOptionsTransforms,
} = require('./options-transforms');

const analyzeCommits = wrapStep(
  'analyzeCommits',
  compose(logPluginVersion('analyzeCommits'), withOnlyPackageCommits)
);

const generateNotes = wrapStep(
  'generateNotes',
  compose(
    logPluginVersion('generateNotes'),
    withOnlyPackageCommits,
    withOptionsTransforms([mapNextReleaseVersion(versionToGitTag)])
  )
);

module.exports = {
  analyzeCommits,
  generateNotes,
  tagFormat: readPkg.sync().name + '-v${version}',
};
