const _ = require('lodash')
const debug = require('debug')('cypress:server:chrome_policy_check')
const errors = require('../errors')
const os = require('os')

// https://www.chromium.org/administrators/policy-list-3#Proxy
// https://www.chromium.org/administrators/policy-list-3#ProxySettings
const BAD_PROXY_POLICY_NAMES = [
  'ProxySettings',
  'ProxyMode',
  'ProxyServerMode',
  'ProxyServer',
  'ProxyPacUrl',
  'ProxyBypassList',
]

// https://www.chromium.org/administrators/policy-list-3#Extensions
const BAD_EXTENSION_POLICY_NAMES = [
  'ExtensionInstallBlacklist',
  'ExtensionInstallWhitelist',
  'ExtensionInstallForcelist',
  'ExtensionInstallSources',
  'ExtensionAllowedTypes',
  'ExtensionAllowInsecureUpdates',
  'ExtensionSettings',
  'UninstallBlacklistedExtensions',
]

const POLICY_KEYS = [
  'Software\\Policies\\Google\\Chrome',
  'Software\\Policies\\Google\\Chromium',
]

const POLICY_HKEYS = [
  'HKEY_LOCAL_MACHINE',
  'HKEY_CURRENT_USER',
]

function warnIfPolicyMatches (policyNames, allPolicies, warningName, cb) {
  const matchedPolicyPaths = _.chain(policyNames)
  .map((policyName) => {
    return _.chain(allPolicies)
    .find({ name: policyName })
    .get('fullPath')
    .value()
  })
  .filter()
  .value()

  if (!matchedPolicyPaths.length) {
    return
  }

  cb(errors.get(warningName, matchedPolicyPaths))
}

function getRunner ({ enumerateValues }) {
  function getAllPolicies () {
    return _.flattenDeep(
      POLICY_KEYS.map((key) => {
        return POLICY_HKEYS.map((hkey) => {
          return enumerateValues(hkey, key)
          .map((value) => {
            value.fullPath = `${hkey}\\${key}\\${value.name}`

            return value
          })
        })
      }),
    )
  }

  return function run (cb) {
    try {
      debug('running chrome policy check')

      const policies = getAllPolicies()
      const badPolicyNames = _.concat(BAD_PROXY_POLICY_NAMES, BAD_EXTENSION_POLICY_NAMES)

      debug('received policies %o', { policies, badPolicyNames })

      warnIfPolicyMatches(badPolicyNames, policies, 'BAD_POLICY_WARNING', cb)
    } catch (err) {
      debug('error running policy check %o', { err })
    }
  }
}

module.exports = {
  run: _.noop,
  getRunner,
}

/**
 * Only check on Windows. While it is possible for macOS/Linux to have preferences set that
 * override Cypress's settings, it's never been reported as an issue and would require more
 * native extensions to support checking.
 * https://github.com/cypress-io/cypress/issues/4391
 */
if (os.platform() === 'win32') {
  try {
    const registryJs = require('registry-js')

    module.exports = {
      run: getRunner(registryJs),
      getRunner,
    }
  } catch (err) {
    debug('error initializing chrome policy check %o', { err })
  }
}
