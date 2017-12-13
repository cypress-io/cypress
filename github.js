const { publish } = require('@semantic-release/github');
const withGitTag = require('./src/with-git-tag');

module.exports = withGitTag(publish);
