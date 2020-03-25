const Bluebird = require('bluebird')
const { expect } = require('chai')
const fse = require('fs-extra')
const path = require('path')

module.exports = (on, config) => {
  const parentPid = process.ppid
  let { PATH_TO_CHROME_PROFILE } = config.env

  // the existing path to the chrome profile contains
  // the wrong pid - so we need to swap it out with our
  // parent child process's pid
  // NOTE: we could yield the browser's profilePath as
  // a property to make it easier to do this
  PATH_TO_CHROME_PROFILE = PATH_TO_CHROME_PROFILE
  .split(/run-\d+/)
  .join(`run-${parentPid}`)

  on('before:browser:launch', (browser, launchOptions) => {
    const { preferences } = launchOptions

    preferences.default.foo = 'bar'
    preferences.defaultSecure.bar = 'baz'
    preferences.localState.baz = 'quux'

    return launchOptions
  })

  on('task', {
    assert: () => {
      return Bluebird.join(
        fse.readJson(path.join(PATH_TO_CHROME_PROFILE, 'Default/Preferences')),
        fse.readJson(path.join(PATH_TO_CHROME_PROFILE, 'Default/Secure Preferences')),
        fse.readJson(path.join(PATH_TO_CHROME_PROFILE, 'Local State')),
        (defaultPrefs, defaultSecure, localState) => {
          expect(defaultPrefs.foo).to.eq('bar')
          expect(defaultSecure.bar).to.eq('baz')
          expect(localState.baz).to.eq('quux')
        },
      )
      .thenReturn(null)
    },
  })
}
