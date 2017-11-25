const execa = require('execa');
const { getCommits } = require('semantic-release/lib/plugins/get-commits');

// https://stackoverflow.com/questions/424071/how-to-list-all-the-files-in-a-commit
const getCommitFiles = hash => execa('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', hash]);

// TODO: Make dynamic
const getPackagePath = () => {
  const name = process.cwd().split('/').pop();
  return `packages/${name}`;
};

module.exports = async (pluginConfig, options) => {
  const { logger } = options;
  const result = await getCommits(pluginConfig, options);
  const { commits } = result;
  const packagePath = getPackagePath();

  logger.log(`Filter commits that didn't touch files in %s`, packagePath);
  const commitsWithFiles = await Promise.all(commits.map(async commit => {
    const { stdout } = await getCommitFiles(commit.hash);
    return { ...commit, files: stdout.split('\n') };
  }));
  result.commits = commitsWithFiles.filter(({ files }) => files.some(path => path.includes(packagePath)));

  return result;
};
