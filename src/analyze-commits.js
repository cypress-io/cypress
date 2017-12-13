const commitAnalyzer = require('@semantic-release/commit-analyzer');
const { filterCommits } = require('./options-transforms');
const onlyPackageCommits = require('./only-package-commits');

async function analyzeCommits(pluginConf, options) {
  return commitAnalyzer(
    pluginConf,
    await filterCommits(onlyPackageCommits)(options)
  );
}

module.exports = analyzeCommits;
