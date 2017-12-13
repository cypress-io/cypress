const { getLastRelease } = require('@semantic-release/npm');
const getVersionHead = require('semantic-release/lib/get-version-head');
const gitTag = require('./version-to-git-tag');

module.exports = async (pluginConfig, options) => {
  const result = await getLastRelease(pluginConfig, options);

  /**
   * Multiple problems identifying the last release for a monorepo package:
   *
   * 1. `npm` doesn't publish `gitHead` as part of a release unless `package.json` and `.git`
   *    are in the same folder (never true for a monorepo).
   *    https://github.com/npm/read-package-json/issues/66#issuecomment-222036879
   *
   * 2. We can use `semantic-release`'s fallback strategy, searching for a matching git tag,
   *    but we must update the git tag format to be compatible with the monorepo workflow.
   **/
  if (result && !result.gitHead) {
    return {
      ...result,
      ...(await getVersionHead(null, await gitTag(result.version))),
    };
  }

  return result;
};
