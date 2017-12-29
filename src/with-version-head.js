const getVersionHead = require('semantic-release/lib/get-version-head');
const gitTag = require('./version-to-git-tag');

/**
 * Multiple problems identifying the "version head" for a monorepo package:
 *
 * 1. `npm` doesn't publish `gitHead` as part of a release unless `package.json` and `.git`
 *    are in the same folder (never true for a monorepo).
 *    https://github.com/npm/read-package-json/issues/66#issuecomment-222036879
 *
 * 2. We can use `semantic-release`'s fallback strategy, searching for a matching git tag,
 *    but we must update the git tag format to be compatible with the monorepo workflow.
 **/
const withVersionHead = plugin => async (pluginConfig, options) => {
  const release = await plugin(pluginConfig, options);

  if (release && !release.gitHead) {
    return {
      ...release,
      ...(await getVersionHead(null, await gitTag(release.version))),
    };
  }
};

module.exports = withVersionHead;
