const { curryN, isEmpty, pipeP, tap, unless, when } = require('ramda');

const debug = require('debug')('semantic-release:monorepo');
const gitTag = require('./version-to-git-tag');
const { getTagHead, fetchTags, unshallow } = require('./git-utils');

const debugTap = message => tap(curryN(2, debug)(message));
const whenIsEmpty = when(isEmpty);
const unlessIsEmpty = unless(isEmpty);

/**
 * Attempt to find the git tag for the given tag name.
 * If necessary, will fetch git tags and "unshallow".
 * Adapted from: https://github.com/semantic-release/npm/blob/cf039fdafda1a5ce43c2a5f033160cd46487f102/lib/get-version-head.js
 */
const findTagHead = tagName =>
  pipeP(
    getTagHead,
    whenIsEmpty(
      // Fetching tags is likely pointless when running on CI since it's assumed
      // that the repo has just been cloned (implying up-to-date tags).
      // However, when running locally (e.g. `--dry-run`), it's not uncommon that
      // tags are out of sync with origin, which is why we include this step.
      pipeP(
        fetchTags,
        debugTap('Unable to find tagHead. Fetching tags and re-trying.'),
        () => getTagHead(tagName)
      )
    ),
    whenIsEmpty(
      // Unshallowing is likely only relevant on CI, where using a shallow clone
      // is more performant than downloading the entire repo.
      pipeP(
        unshallow,
        debugTap('Unable to find tagHead. Unshallowing and re-trying.'),
        () => getTagHead(tagName)
      )
    ),
    unlessIsEmpty(debugTap('Use tagHead: %o'))
  )(tagName);

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
const withVersionHead = plugin => async (pluginConfig, config) => {
  const release = await plugin(pluginConfig, config);

  if (release) {
    return {
      ...release,
      gitHead: await findTagHead(await gitTag(release.version)),
    };
  }
};

module.exports = withVersionHead;
