require('../spec_helper')

const _ = require('lodash')
const { stripIndent } = require('common-tags')
const chromePolicyCheck = require(`${root}lib/util/chrome_policy_check`)

describe('lib/util/chrome_policy_check', () => {
  context('.getRunner returns a function', () => {
    it('calls callback with an error if policies are found', () => {
      const run = chromePolicyCheck.getRunner({
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

      const cb = sinon.stub()

      run(cb)

      expect(cb).to.be.calledOnce

      expect(cb.getCall(0).args[0].message).to.eq(stripIndent(`\
Cypress detected policy settings on your computer that may cause issues.

The following policies were detected that may prevent Cypress from automating Chrome:

 > HKEY_LOCAL_MACHINE\\Software\\Policies\\Google\\Chrome\\ProxyServer
 > HKEY_CURRENT_USER\\Software\\Policies\\Google\\Chromium\\ExtensionSettings

For more information, see https://on.cypress.io/bad-browser-policy\
`))
    })

    it('does not call callback if no policies are found', () => {
      const run = chromePolicyCheck.getRunner({
        enumerateValues: _.constant([]),
      })

      const cb = sinon.stub()

      run(cb)

      expect(cb).to.not.be.called
    })

    it('fails silently if enumerateValues throws', () => {
      const run = chromePolicyCheck.getRunner({
        enumerateValues () {
          throw new Error('blah')
        },
      })

      const cb = sinon.stub()

      run(cb)

      expect(cb).to.not.be.called
    })
  })
})
