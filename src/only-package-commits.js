const { identity, memoizeWith, pipeP, propEq } = require('ramda');
const pkgUp = require('pkg-up');
const readPkg = require('read-pkg');
const path = require('path');
const pLimit = require('p-limit');
const debug = require('debug')('semantic-release:monorepo');
const { getCommitFiles, getRoot } = require('./git-utils');
const { getPackages } = require('./lerna-utils');
const { mapCommits } = require('./options-transforms');

const memoizedGetCommitFiles = memoizeWith(identity, getCommitFiles);

/**
 * Get the normalized PACKAGE root path, relative to the git PROJECT root.
 */
const normalizedPath = async packagePath => {
  const gitRoot = await getRoot();

  return path.relative(gitRoot, packagePath);
};

const getPackagePath = async () => {
  const packagePath = await pkgUp();

  return normalizedPath(path.resolve(packagePath, '..'));
};

const getUsedLocalPrivatePackages = async () => {
  const packagePath = await pkgUp();
  const { dependencies } = require(packagePath);

  if (!dependencies) {
    return [];
  }

  const lernaPackages = await getPackages();
  const privatePackages = lernaPackages.filter(propEq('private', true));

  // filter and transform dependencies
  // to include only the paths to local private packages
  return Promise.all(
    Object.keys(dependencies)
      .map(dep => {
        const lernaDep = privatePackages.find(propEq('name', dep));

        return lernaDep && normalizedPath(lernaDep.location);
      })
      .filter(identity)
  );
};

const withFiles = async commits => {
  const limit = pLimit(Number(process.env.SRM_MAX_THREADS) || 500);
  return Promise.all(
    commits.map(commit =>
      limit(async () => {
        const files = await memoizedGetCommitFiles(commit.hash);
        return { ...commit, files };
      })
    )
  );
};

const onlyPackageCommits = async commits => {
  const packagePath = await getPackagePath();
  debug('Package path: "%s"', packagePath);

  const localPackages = await getUsedLocalPrivatePackages();
  debug('Local packages: "%o"', localPackages);

  const paths = [packagePath, ...localPackages];
  debug('Filter commits by package paths: "%o"', paths);

  const commitsWithFiles = await withFiles(commits);

  // Convert paths into segments - one for each folder
  const pathSegments = paths.map(p => p.split(path.sep));

  return commitsWithFiles.filter(({ files, subject }) => {
    // Normalise paths and check if any changed files' path segments start
    // with that of the package root or local dependency paths
    const packageFile = files.find(file =>
      pathSegments.some(segments => {
        const fileSegments = path.normalize(file).split(path.sep);

        // Check the file is a *direct* descendent of the path
        return segments.every((segment, i) => segment === fileSegments[i]);
      })
    );

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
