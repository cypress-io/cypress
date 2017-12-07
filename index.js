const { compose } = require('ramda');

const commitAnalyzer = require('@semantic-release/commit-analyzer');
const releaseNotesGenerator = require('@semantic-release/release-notes-generator');

const withPackageCommits = require('./src/with-package-commits');
const withVersion = require('./src/with-version');
const withGitTag = require('./src/with-git-tag');

module.exports = {
  analyzeCommits: withPackageCommits(commitAnalyzer),
  generateNotes: compose(
    withGitTag,
    withVersion,
    withPackageCommits
  )(releaseNotesGenerator),
};
