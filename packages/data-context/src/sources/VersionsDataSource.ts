import os from 'os'
import type { DataContext } from '..'
import type { TestingType } from '@packages/types'
import Debug from 'debug'

const debug = Debug('cypress:data-context:sources:VersionsDataSource')

const pkg = require('@packages/root')
const nmi = require('node-machine-id')

interface Version {
  id: string
  released: string
  version: string
}

interface VersionData {
  current: Version
  latest: Version
}

const REMOTE_MANIFEST_URL = 'https://download.cypress.io/desktop.json'
const NPM_CYPRESS_REGISTRY = 'https://registry.npmjs.org/cypress'

export class VersionsDataSource {
  private _initialLaunch: boolean
  private _currentTestingType: TestingType | null

  constructor (private ctx: DataContext) {
    this._initialLaunch = true
    this._currentTestingType = this.ctx.coreData.currentTestingType
  }

  #populateVersionMetadata () {
    let versionData = this.ctx.coreData.versionData

    if (!versionData) {
      versionData = {
        latestVersion: this.#getLatestVersion().catch((e) => pkg.version),
        npmMetadata: this.#getVersionMetadata().catch((e) => ({})),
      }

      this.ctx.update((d) => {
        d.versionData = versionData
      })
    }

    return versionData
  }

  /**
   * Returns most recent and current version of Cypress
   * {
   *   current: {
   *     id: '8.7.0',
   *     version: '8.7.0',
   *     released: '2021-10-15T21:38:59.983Z'
   *   },
   *   latest: {
   *     id: '8.8.0',
   *     version: '8.8.0',
   *     released: '2021-10-25T21:38:59.983Z'
   *   }
   * }
   */
  async versionData (): Promise<VersionData> {
    const versionData = this.#populateVersionMetadata()
    const [latestVersion, npmMetadata] = await Promise.all([
      versionData.latestVersion,
      versionData.npmMetadata,
    ])

    const latestVersionMetadata: Version = {
      id: latestVersion,
      version: latestVersion,
      released: npmMetadata[latestVersion] ?? new Date().toISOString(),
    }

    return {
      latest: latestVersionMetadata,
      current: {
        id: pkg.version,
        version: pkg.version,
        released: npmMetadata[pkg.version] ?? new Date().toISOString(),
      },
    }
  }

  resetLatestVersionTelemetry () {
    if (this.ctx.coreData.currentTestingType !== this._currentTestingType) {
      debug('resetting latest version telemetry call due to a different testing type')
      this._currentTestingType = this.ctx.coreData.currentTestingType
      this.ctx.update((d) => {
        if (d.versionData) {
          d.versionData.latestVersion = this.#getLatestVersion()
        }
      })
    }
  }

  async #getVersionMetadata (): Promise<Record<string, string>> {
    const now = new Date().toISOString()
    const DEFAULT_RESPONSE = {
      [pkg.version]: now,
    }

    if (this.ctx.isRunMode) {
      return DEFAULT_RESPONSE
    }

    let response

    try {
      response = await this.ctx.util.fetch(NPM_CYPRESS_REGISTRY)
      const responseJson = await response.json() as { time: Record<string, string>}

      debug('NPM release dates received %o', { modified: responseJson.time.modified })

      return responseJson.time ?? now
    } catch (e) {
      // ignore any error from this fetch, they are gracefully handled
      // by showing the current version only
      debug('Error fetching %o', NPM_CYPRESS_REGISTRY, e)

      return DEFAULT_RESPONSE
    }
  }

  async #getLatestVersion (): Promise<string> {
    if (this.ctx.isRunMode) {
      return pkg.version
    }

    const id = await VersionsDataSource.machineId()

    const manifestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'x-cypress-version': pkg.version,
      'x-os-name': os.platform(),
      'x-arch': os.arch(),
      'x-initial-launch': String(this._initialLaunch),
      'x-logged-in': String(!!this.ctx.user),
    }

    if (this._currentTestingType) {
      manifestHeaders['x-testing-type'] = this._currentTestingType
    }

    if (id) {
      manifestHeaders['x-machine-id'] = id
    }

    const devServer = this.ctx.lifecycleManager?.loadedConfigFile?.component?.devServer

    if (typeof devServer === 'object') {
      if (devServer.bundler) {
        manifestHeaders['x-dev-server'] = devServer.bundler
      }

      if (devServer.framework) {
        manifestHeaders['x-framework'] = devServer.framework
      }
    }

    try {
      const manifestResponse = await this.ctx.util.fetch(REMOTE_MANIFEST_URL, {
        headers: manifestHeaders,
      })

      debug('retrieving latest version information with headers: %o', manifestHeaders)

      const manifest = await manifestResponse.json() as { version: string }

      debug('latest version information: %o', manifest)

      return manifest.version ?? pkg.version
    } catch (e) {
      // ignore any error from this fetch, they are gracefully handled
      // by showing the current version only
      debug('Error fetching %s: %o', REMOTE_MANIFEST_URL, e)

      return pkg.version
    } finally {
      this._initialLaunch = false
    }
  }

  private static async machineId (): Promise<string | undefined> {
    try {
      return await nmi.machineId()
    } catch (error) {
      return undefined
    }
  }
}
