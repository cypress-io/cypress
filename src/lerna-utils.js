const execa = require('execa');

const lerna = async (args, options = {}) => {
  const { stdout } = await execa('lerna', args, options);
  return stdout;
};

/**
 * @async
 * @return {Promise<Object>} Registered lerna packages
 */
const getPackages = async () => JSON.parse(await lerna(['la', '--json']));

module.exports = {
  getPackages,
};
