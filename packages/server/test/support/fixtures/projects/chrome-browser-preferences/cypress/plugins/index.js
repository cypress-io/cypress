const Bluebird = require('bluebird')
const { expect } = require('chai')
const fse = require('fs-extra')
const os = require('os')
const path = require('path')

module.exports = (on) => {
  on('before:browser:launch', (browser, options) => {
    const { preferences } = options

    preferences.default.foo = 'bar'
    preferences.defaultSecure.bar = 'baz'
    preferences.localState.baz = 'quux'

    return options
  })

  on('task', {
    assert: () => {
      const userDataDir = `${os.homedir()}/.config/Cypress/cy/test/browsers/chrome/run-${process.ppid}/`

      return Bluebird.join(
        fse.readJson(path.join(userDataDir, 'Default/Preferences')),
        fse.readJson(path.join(userDataDir, 'Default/Secure Preferences')),
        fse.readJson(path.join(userDataDir, 'Local State')),
        (defaultPrefs, defaultSecure, localState) => {
          expect(defaultPrefs.foo).to.eq('bar')
          expect(defaultSecure.bar).to.eq('baz')
          expect(localState.baz).to.eq('quux')
        }
      )
      .thenReturn(null)
    },
  })
}
