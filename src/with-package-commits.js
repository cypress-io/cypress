const debug = require('debug')('semantic-release:commit-analyzer');
const pkgUp = require('pkg-up');
const { getCommitFiles, getGitRoot } = require('./git-utils');
const overrideOption = require('./override-option');

const getPackagePath = async () => {
  const path = await pkgUp();
  const gitRoot = await getGitRoot();
  return path.replace('package.json', '').replace(`${gitRoot}/`, '');
};

const withFiles = async commits => {
  return Promise.all(commits.map(async commit => {
    const files = await getCommitFiles(commit.hash);
    return { ...commit, files };
  }));
};

const withPackageCommits = async commits => {
  const packagePath = await getPackagePath();
  debug('Filter commits by package path: "%s"', packagePath);
  const commitsWithFiles = await withFiles(commits);

  return commitsWithFiles.filter(
    ({ files, subject }) => {
      const matchingPath = files.find(path => path.indexOf(packagePath) === 0);

      if (matchingPath) {
        debug('Including commit "%s" because it modified package file "%s".', subject, matchingPath);
      }

      return !!matchingPath;
    }
  );
};

module.exports = overrideOption('commits', withPackageCommits);