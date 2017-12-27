const { pipeP } = require('ramda');
const commitAnalyzer = require('@semantic-release/commit-analyzer');
const readPkg = require('read-pkg');
const { mapCommits } = require('./options-transforms');
const onlyPackageCommits = require('./only-package-commits');

// Async version of Ramda's `tap`
const tapA = fn => async x => {
  await fn(x);
  return x;
};

const logFilteredCommitCount = logger => async ({ commits }) => {
  const { name } = await readPkg();

  logger.log(
    'Found %s commits for package %s since last release',
    commits.length,
    name
  );
};

async function analyzeCommits(pluginConf, options) {
  const { logger } = options;

  return commitAnalyzer(
    pluginConf,
    await pipeP(
      mapCommits(onlyPackageCommits),
      tapA(logFilteredCommitCount(logger))
    )(options)
  );
}

module.exports = analyzeCommits;
