const execa = require('execa');

const lerna = async (args, options = {}) => {
  const { stdout } = await execa('lerna', args, options);
  return stdout;
};

/**
 * @async
 * @return {Promise<Object>} Registered lerna packages
 */
const getPackageInfo = async () => JSON.parse(await lerna(['la', '--json']));

/**
 * @async
 * @return {Promise<Object>} Registered lerna packages and their lerna dependencies
 */
const getDependencyGraph = async () =>
  JSON.parse(await lerna(['la', '--graph']));

module.exports = {
  getPackageInfo,
  getDependencyGraph,
};
