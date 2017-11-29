const pkgUp = require('pkg-up');
const { getCommitFiles, getGitRoot } = require('./git-utils');

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
  const commitsWithFiles = await withFiles(commits);

  return commitsWithFiles.filter(
    ({ files }) => files.some(path => path.includes(packagePath))
  );
};

module.exports = withPackageCommits;