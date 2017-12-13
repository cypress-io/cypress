const { pipeP } = require('ramda');
const releaseNotesGenerator = require('@semantic-release/release-notes-generator');
const withPackageCommits = require('./only-package-commits');
const versionToGitTag = require('./version-to-git-tag');

const {
  filterCommits,
  mapNextReleaseVersion,
  mapLastReleaseVersionToLastReleaseGitTag,
  mapNextReleaseVersionToNextReleaseGitTag,
} = require('./options-transforms');

async function generateNotes(pluginConf, options) {
  return releaseNotesGenerator(
    pluginConf,
    await pipeP(
      filterCommits(withPackageCommits),
      mapLastReleaseVersionToLastReleaseGitTag(versionToGitTag),
      mapNextReleaseVersionToNextReleaseGitTag(versionToGitTag),
      mapNextReleaseVersion(versionToGitTag)
    )(options)
  );
}

module.exports = generateNotes;
