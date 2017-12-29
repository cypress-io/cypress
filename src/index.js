const { compose } = require('ramda');
const pluginDefinitions = require('semantic-release/lib/plugins/definitions');
const withOnlyPackageCommits = require('./only-package-commits');
const versionToGitTag = require('./version-to-git-tag');
const withVersionHead = require('./with-version-head');
const {
  wrapPlugin,
  wrapMultiPlugin,
} = require('semantic-release-plugin-decorators');

const {
  mapNextReleaseVersion,
  mapLastReleaseVersionToLastReleaseGitTag,
  mapNextReleaseVersionToNextReleaseGitTag,
  withOptionsTransforms,
} = require('./options-transforms');

const NAMESPACE = 'monorepo';

const analyzeCommits = wrapPlugin(
  NAMESPACE,
  'analyzeCommits',
  withOnlyPackageCommits,
  pluginDefinitions.analyzeCommits.default
);

const generateNotes = wrapPlugin(
  NAMESPACE,
  'generateNotes',
  compose(
    withOnlyPackageCommits,
    withOptionsTransforms([
      mapLastReleaseVersionToLastReleaseGitTag(versionToGitTag),
      mapNextReleaseVersionToNextReleaseGitTag(versionToGitTag),
      mapNextReleaseVersion(versionToGitTag),
    ])
  ),
  pluginDefinitions.generateNotes.default
);

const getLastRelease = wrapPlugin(
  NAMESPACE,
  'getLastRelease',
  withVersionHead,
  pluginDefinitions.getLastRelease.default
);

const publish = wrapMultiPlugin(
  NAMESPACE,
  'publish',
  withOptionsTransforms([
    mapNextReleaseVersionToNextReleaseGitTag(versionToGitTag),
  ]),
  pluginDefinitions.publish.default
);

module.exports = {
  analyzeCommits,
  generateNotes,
  getLastRelease,
  publish,
};
