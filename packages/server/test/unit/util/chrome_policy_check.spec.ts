import { describe, expect, it, vi } from 'vitest'
import _ from 'lodash'
import { stripIndent } from 'common-tags'
import { stripVTControlCharacters as stripAnsi } from 'util'
import { getRunner } from '../../../lib/util/chrome_policy_check'

describe('lib/util/chrome_policy_check', () => {
  describe('.getRunner returns a function', () => {
    it('calls callback with an error if policies are found', () => {
      const run = getRunner({
        enumerateValues (hkey, key) {
        // mock a registry with a couple of policies
          return _.get({
            'HKEY_LOCAL_MACHINE': {
              'Software\\Policies\\Google\\Chrome': [
                { name: 'ProxyServer' },
              ],
            },
            'HKEY_CURRENT_USER': {
              'Software\\Policies\\Google\\Chromium': [
                { name: 'ExtensionSettings' },
              ],
            },
          }, `${hkey}.${key}`, [])
        },
      })

      const cb = vi.fn()

      run(cb)

      expect(cb).toHaveBeenCalledOnce()

      expect(stripAnsi(cb.mock.calls[0][0].message)).toBe(stripIndent(`\
Cypress detected policy settings on your computer that may cause issues.

The following policies were detected that may prevent Cypress from automating Chrome:

 - HKEY_LOCAL_MACHINE\\Software\\Policies\\Google\\Chrome\\ProxyServer
 - HKEY_CURRENT_USER\\Software\\Policies\\Google\\Chromium\\ExtensionSettings

For more information, see https://on.cypress.io/bad-browser-policy\
`))
    })

    it('does not call callback if no policies are found', () => {
      const run = getRunner({
        enumerateValues: _.constant([]),
      })

      const cb = vi.fn()

      run(cb)

      expect(cb).not.toHaveBeenCalled()
    })

    it('fails silently if enumerateValues throws', () => {
      const run = getRunner({
        enumerateValues () {
          throw new Error('blah')
        },
      })

      const cb = vi.fn()

      run(cb)

      expect(cb).not.toHaveBeenCalled()
    })
  })
})
