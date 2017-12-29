const { pipeP } = require('ramda');
const pkgUp = require('pkg-up');
const readPkg = require('read-pkg');
const debug = require('debug')('semantic-release:monorepo');

const { getCommitFiles, getGitRoot } = require('./git-utils');
const { mapCommits } = require('./options-transforms');

const getPackagePath = async () => {
  const path = await pkgUp();
  const gitRoot = await getGitRoot();
  return path.replace('package.json', '').replace(`${gitRoot}/`, '');
};

const withFiles = async commits => {
  return Promise.all(
    commits.map(async commit => {
      const files = await getCommitFiles(commit.hash);
      return { ...commit, files };
    })
  );
};

const onlyPackageCommits = async commits => {
  const packagePath = await getPackagePath();
  debug('Filter commits by package path: "%s"', packagePath);
  const commitsWithFiles = await withFiles(commits);

  return commitsWithFiles.filter(({ files, subject }) => {
    const packageFile = files.find(path => path.indexOf(packagePath) === 0);

    if (packageFile) {
      debug(
        'Including commit "%s" because it modified package file "%s".',
        subject,
        packageFile
      );
    }

    return !!packageFile;
  });
};

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

const withOnlyPackageCommits = plugin => async (pluginConfig, config) => {
  const { logger } = config;

  return plugin(
    pluginConfig,
    await pipeP(
      mapCommits(onlyPackageCommits),
      tapA(logFilteredCommitCount(logger))
    )(config)
  );
};

module.exports = withOnlyPackageCommits;
