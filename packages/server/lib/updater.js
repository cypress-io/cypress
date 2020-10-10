const debug = require('debug')('cypress:server:updater')
const semver = require('semver')
const rp = require('@cypress/request-promise')
const pkg = require('@packages/root')
const { agent } = require('@packages/network')
const konfig = require('./konfig')
const { machineId } = require('./util/machine_id')

const _getManifest = (id) => {
  const url = konfig('desktop_manifest_url')

  return rp.get({
    url,
    headers: {
      'x-cypress-version': pkg.version,
      'x-machine-id': id,
    },
    agent,
    proxy: null,
    json: true,
  })
}

const check = async ({ onNewVersion, onNoNewVersion } = {}) => {
  try {
    const id = await machineId()
    const manifest = await _getManifest(id)

    if (!manifest || !manifest.version) {
      throw new Error('manifest is empty or does not have a version')
    }

    debug('latest version of Cypress is:', manifest.version)

    const localVersion = pkg.version
    const newVersionAvailable = semver.gt(manifest.version, localVersion)

    if (newVersionAvailable) {
      debug('new version of Cypress exists:', manifest.version)
      onNewVersion(manifest)
    } else {
      debug('new version of Cypress does not exist')
      onNoNewVersion()
    }
  } catch (err) {
    debug('error getting latest version of Cypress', err)
    onNoNewVersion()
  }
}

module.exports = {
  check,
  _getManifest,
}
