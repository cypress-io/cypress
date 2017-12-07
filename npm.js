const { publish } = require('@semantic-release/npm');
const withGitTag = require('./src/with-git-tag');

module.exports = withGitTag(publish);