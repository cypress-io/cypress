const {
  always,
  curryN,
  equals,
  isNil,
  pipeP,
  tap,
  unless,
  when,
} = require('ramda');

const debug = require('debug')('semantic-release:monorepo');
const gitTag = require('./version-to-git-tag');
const { gitTagHead, unshallow } = require('./git-utils');

/**
 * Attempt to find the git tag for the given tag name.
 * Will "unshallow" the repo and try again if not successful.
 * Adapted from: https://github.com/semantic-release/npm/blob/cf039fdafda1a5ce43c2a5f033160cd46487f102/lib/get-version-head.js
 */
const getTagHead = tagName =>
  pipeP(
    gitTagHead,
    when(isNil, pipeP(unshallow, always(tagName))),
    when(equals(tagName), gitTagHead),
    unless(isNil, tap(curryN(2, debug)('Use tagHead: %s')))
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
const withVersionHead = plugin => async (pluginConfig, options) => {
  const release = await plugin(pluginConfig, options);

  if (release) {
    return {
      ...release,
      gitHead: await getTagHead(await gitTag(release.version)),
    };
  }
};

module.exports = withVersionHead;
