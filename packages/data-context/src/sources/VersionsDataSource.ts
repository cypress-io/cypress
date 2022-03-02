import os from 'os'
import type { DataContext } from '..'
import type { TestingType } from '@packages/types'
import Debug from 'debug'

const debug = Debug('cypress:data-context:versions-data-source')

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
  private _latestVersion: Promise<string>
  private _npmMetadata: Promise<Record<string, string> | null>

  constructor (private ctx: DataContext) {
    this._initialLaunch = true
    this._currentTestingType = this.ctx.coreData.currentTestingType
    this._latestVersion = this.getLatestVersion()
    this._npmMetadata = this.getVersionMetadata()
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
    const [latestVersion, npmMetadata] = await Promise.all([this._latestVersion, this._npmMetadata])

    const latestVersionMetadata: Version = {
      id: latestVersion,
      version: latestVersion,
      released: npmMetadata ? npmMetadata[latestVersion] as string : new Date().toISOString(),
    }

    return {
      latest: latestVersionMetadata,
      current: {
        id: pkg.version,
        version: pkg.version,
        released: npmMetadata ? npmMetadata[pkg.version] as string : new Date().toISOString(),
      },
    }
  }

  resetLatestVersionTelemetry () {
    if (this.ctx.coreData.currentTestingType !== this._currentTestingType) {
      debug('resetting latest version telemetry call due to a different testing type')
      this._currentTestingType = this.ctx.coreData.currentTestingType
      this._latestVersion = this.getLatestVersion()
    }
  }

  private async getVersionMetadata (): Promise<Record<string, string> | null> {
    if (this.ctx.isRunMode) {
      return {
        [pkg.version]: new Date().toISOString(),
      }
    }

    let response

    try {
      response = await this.ctx.util.fetch(NPM_CYPRESS_REGISTRY)
    } catch (e) {
      // ignore any error from this fetch, they are gracefully handled
      // by showing the current version only
      debug('Error fetching %o', NPM_CYPRESS_REGISTRY, e)
    }

    if (!response) {
      return null
    }

    const responseJson = await response.json() as { time: Record<string, string>}

    debug('NPM release dates %o', responseJson.time)

    return responseJson.time
  }

  private async getLatestVersion (): Promise<string> {
    if (this.ctx.isRunMode) {
      return pkg.version
    }

    const url = REMOTE_MANIFEST_URL
    const id = await VersionsDataSource.machineId()

    const manifestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'x-cypress-version': pkg.version,
      'x-os-name': os.platform(),
      'x-arch': os.arch(),
      'x-initial-launch': String(this._initialLaunch),
    }

    if (this._currentTestingType) {
      manifestHeaders['x-testing-type'] = this._currentTestingType
    }

    if (id) {
      manifestHeaders['x-machine-id'] = id
    }

    let manifestResponse

    try {
      manifestResponse = await this.ctx.util.fetch(url, {
        headers: manifestHeaders,
      })
    } catch (e) {
      // ignore any error from this fetch, they are gracefully handled
      // by showing the current version only
      debug('Error fetching %o', url, e)
    }

    if (!manifestResponse) {
      return pkg.version
    }

    debug('retrieving latest version information with headers: %o', manifestHeaders)

    const manifest = await manifestResponse.json() as { version: string }

    debug('latest version information: %o', manifest)

    this._initialLaunch = false

    return manifest.version
  }

  private static async machineId (): Promise<string | undefined> {
    try {
      return nmi.machineId()
    } catch (error) {
      return undefined
    }
  }
}
