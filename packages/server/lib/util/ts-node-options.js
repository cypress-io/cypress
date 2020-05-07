// returns options for ts-node registration
// https://github.com/TypeStrong/ts-node
const _ = require('lodash')

/**
 * Default ts - node options.We want to output CommonJS modules.
 * And we want to run fast - thus transpile only mode (no type checking)
*/
const tsOptions = {
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
    esModuleInterop: true,
  },
}

/**
 * Returns combined object with ts-node options.
 * @param {string} tsPath Path to TypeScript
 */
function getTsNodeOptions (tsPath) {
  const merged = _.cloneDeep(tsOptions)

  merged.compiler = tsPath

  return merged
}

module.exports = { getTsNodeOptions }
