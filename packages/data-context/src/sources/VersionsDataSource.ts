import os from 'os'
import type { DataContext } from '..'
import type { TestingType } from '@packages/types'
import { CYPRESS_REMOTE_MANIFEST_URL, NPM_CYPRESS_REGISTRY_URL } from '@packages/types'
import Debug from 'debug'
import { dependencyNamesToDetect } from '@packages/scaffold-config'

const debug = Debug('cypress:data-context:sources:VersionsDataSource')

const pkg = require('@packages/root')

interface Version {
  id: string
  released: string
  version: string
}

interface VersionData {
  current: Version
  latest: Version
}

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
      response = await this.ctx.util.fetch(NPM_CYPRESS_REGISTRY_URL)
      const responseJson = await response.json() as { time: Record<string, string>}

      debug('NPM release dates received %o', { modified: responseJson.time.modified })

      return responseJson.time ?? now
    } catch (e) {
      // ignore any error from this fetch, they are gracefully handled
      // by showing the current version only
      debug('Error fetching %o', NPM_CYPRESS_REGISTRY_URL, e)

      return DEFAULT_RESPONSE
    }
  }

  async #getLatestVersion (): Promise<string> {
    if (this.ctx.isRunMode) {
      return pkg.version
    }

    debug('#getLatestVersion')

    const preferences = await this.ctx.config.localSettingsApi.getPreferences()
    const notificationPreferences: ('started' | 'failing' | 'passed' | 'failed' | 'cancelled' | 'errored')[] = [
      ...preferences.notifyWhenRunCompletes ?? [],
    ]

    if (preferences.notifyWhenRunStarts) {
      notificationPreferences.push('started')
    }

    if (preferences.notifyWhenRunStartsFailing) {
      notificationPreferences.push('failing')
    }

    const id = (await this.ctx.coreData.machineId) || undefined

    const manifestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'x-cypress-version': pkg.version,
      'x-os-name': os.platform(),
      'x-arch': os.arch(),
      'x-notifications': notificationPreferences.join(','),
      'x-initial-launch': String(this._initialLaunch),
      'x-logged-in': String(!!this.ctx.coreData.user),
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

    if (this._initialLaunch) {
      try {
        const projectPath = this.ctx.currentProject

        if (projectPath) {
          debug('Checking %d dependencies in project', dependencyNamesToDetect.length)
          // Check all dependencies of interest in parallel
          const dependencyResults = await Promise.allSettled(
            dependencyNamesToDetect.map(async (dependency) => {
              const result = await this.ctx.util.isDependencyInstalledByName(dependency, projectPath)

              if (!result.detectedVersion) {
                throw new Error(`Could not resolve dependency version for ${dependency}`)
              }

              // For any satisfied dependencies, build a `package@version` string
              return `${result.dependency}@${result.detectedVersion}`
            }),
          )

          // Take any dependencies that were found and combine into comma-separated string
          const headerValue = dependencyResults
          .filter(this.isFulfilled)
          .map((result) => result.value)
          .join(',')

          if (headerValue) {
            manifestHeaders['x-dependencies'] = headerValue
          }
        } else {
          debug('No project path, skipping dependency check')
        }
      } catch (err) {
        debug('Failed to detect project dependencies', err)
      }
    } else {
      debug('Not initial launch of Cypress, skipping dependency check')
    }

    try {
      const manifestResponse = await this.ctx.util.fetch(CYPRESS_REMOTE_MANIFEST_URL, {
        headers: manifestHeaders,
      })

      debug('retrieving latest version information with headers: %o', manifestHeaders)

      const manifest = await manifestResponse.json() as { version: string }

      debug('latest version information: %o', manifest)

      return manifest.version ?? pkg.version
    } catch (e) {
      // ignore any error from this fetch, they are gracefully handled
      // by showing the current version only
      debug('Error fetching %s: %o', CYPRESS_REMOTE_MANIFEST_URL, e)

      return pkg.version
    } finally {
      this._initialLaunch = false
    }
  }

  private isFulfilled<R> (item: PromiseSettledResult<R>): item is PromiseFulfilledResult<R> {
    return item.status === 'fulfilled'
  }
}
