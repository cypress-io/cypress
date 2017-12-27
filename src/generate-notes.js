const { pipeP } = require('ramda');
const releaseNotesGenerator = require('@semantic-release/release-notes-generator');
const withPackageCommits = require('./only-package-commits');
const versionToGitTag = require('./version-to-git-tag');

const {
  mapNextReleaseVersion,
  mapLastReleaseVersionToLastReleaseGitTag,
  mapNextReleaseVersionToNextReleaseGitTag,
  mapCommits,
} = require('./options-transforms');

async function generateNotes(pluginConf, options) {
  return releaseNotesGenerator(
    pluginConf,
    await pipeP(
      mapLastReleaseVersionToLastReleaseGitTag(versionToGitTag),
      mapNextReleaseVersionToNextReleaseGitTag(versionToGitTag),
      mapNextReleaseVersion(versionToGitTag),
      mapCommits(withPackageCommits)
    )(options)
  );
}

module.exports = generateNotes;
