/**
 * Safer konfig load for test code. The original konfig changes the
 * current working directory, thus the tests might be affected
 * unexpectedly. This function loads the konfig, but then
 * restores the current working directory.
 *
 * The tests should use this function to get `konfig` function like
 *
 * @example
 *    const konfig = require('../binary/get-config')()
 */
const getConfig = () => {
  const cwd = process.cwd()
  const konfig = require('../../packages/server/lib/konfig')

  // restore previous cwd in case it was changed by loading "konfig"
  process.chdir(cwd)

  return konfig
}

module.exports = getConfig
