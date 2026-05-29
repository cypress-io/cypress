import _ from 'lodash'

import Debug from 'debug'
import * as errors from '../errors'
import os from 'os'
import { enumerateValues, HKEY } from 'registry-js'
import type { RegistryValue } from 'registry-js'

const debug = Debug('cypress:server:chrome_policy_check')
// https://chromeenterprise.google/policies/#Proxy
// https://chromeenterprise.google/policies/#ProxySettings
const BAD_PROXY_POLICY_NAMES = [
  'ProxySettings',
  'ProxyMode',
  'ProxyServerMode',
  'ProxyServer',
  'ProxyPacUrl',
  'ProxyBypassList',
]

// https://chromeenterprise.google/policies/#Extensions
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

const POLICY_KEYS: string[] = [
  'Software\\Policies\\Google\\Chrome',
  'Software\\Policies\\Google\\Chromium',
]

const POLICY_HKEYS: HKEY[] = [
  HKEY.HKEY_LOCAL_MACHINE,
  HKEY.HKEY_CURRENT_USER,
]

type RegistryValueWithPath = RegistryValue & { fullPath: string }

function warnIfPolicyMatches (policyNames: string[], allPolicies: RegistryValueWithPath[], warningName: Parameters<typeof errors.get>[0], cb: (err: Error) => void) {
  const matchedPolicyPaths = policyNames
  .map((policyName) => _.find(allPolicies, { name: policyName })?.fullPath)
  .filter((path): path is string => Boolean(path))

  if (!matchedPolicyPaths.length) {
    return
  }

  cb(errors.get(warningName, matchedPolicyPaths))
}

export function getRunner ({ enumerateValues }: { enumerateValues: (hkey: HKEY, key: string) => ReadonlyArray<RegistryValue> }) {
  function getAllPolicies (): RegistryValueWithPath[] {
    return _.flattenDeep(
      POLICY_KEYS.map((key) => {
        return POLICY_HKEYS.map((hkey) => {
          return enumerateValues(hkey, key)
          .map((value): RegistryValueWithPath => {
            return {
              ...value,
              fullPath: `${hkey}\\${key}\\${value.name}`,
            }
          })
        })
      }),
    )
  }

  return function run (cb: (err: Error) => void) {
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

export function run (cb: (err: Error) => void): void {
  if (os.platform() !== 'win32') {
    return _.noop(cb)
  }

  /**
   * Only check on Windows. While it is possible for macOS/Linux to have preferences set that
   * override Cypress's settings, it's never been reported as an issue and would require more
   * native extensions to support checking.
   * https://github.com/cypress-io/cypress/issues/4391
   */
  const runner = getRunner({
    enumerateValues,
  })

  return runner(cb)
}
