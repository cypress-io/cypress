const { publish } = require('@semantic-release/github');
const readPkg = require('read-pkg');

module.exports = async (pluginConfig, options) => {
  const { nextRelease, logger } = options;
  const { version } = nextRelease;
  const { name } = await readPkg();

  // TODO: Make dynamic
  nextRelease.gitTag = `${name}-v${version}`;
  logger.log(`Publishing with git tag: %s`, nextRelease.gitTag);

  await publish(pluginConfig, options);
};
