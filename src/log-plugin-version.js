const { resolve } = require('path');
const readPkg = require('read-pkg');
const debug = require('debug')('semantic-release:monorepo');

const logPluginVersion = type => plugin => async (pluginConfig, config) => {
  if (config.options.debug) {
    const { version } = await readPkg(resolve(__dirname, '../'));
    debug('Running %o version %o', type, version);
  }

  return plugin(pluginConfig, config);
};

module.exports = logPluginVersion;
