import os from 'os'
import nmi from 'node-machine-id'
import type { DataContext } from '..'
import type { TestingType } from '@packages/types'

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

type GetLatestVersionOptions = { initialLaunch: boolean, testingType: TestingType | null, currentCypressVersion: string }

export class VersionsDataSource {
  constructor (private ctx: DataContext) {}

  static npmMetadata: undefined | Record<string, string>

  /**
   * Returns most recent and current version of Cypress
   * {
   *   current: {
   *     version: '8.7.0',
   *     released: '2021-10-15T21:38:59.983Z'
   *   },
   *   latest: {
   *     version: '8.8.0',
   *     released: '2021-10-25T21:38:59.983Z'
   *   }
   * }
   */
  async versions (): Promise<VersionData> {
    const currentCypressVersion = require('@packages/root')

    const latestVersion = await this.getLatestVersion({ initialLaunch: true, testingType: this.ctx.coreData.currentTestingType, currentCypressVersion })

    VersionsDataSource.npmMetadata ??= await this.getVersionMetadata()

    const latestVersionMetadata: Version = {
      id: latestVersion,
      version: latestVersion,
      released: VersionsDataSource.npmMetadata[latestVersion] ?? new Date().toISOString(),
    }

    return {
      latest: latestVersionMetadata,
      current: {
        id: currentCypressVersion.version,
        version: currentCypressVersion.version,
        released: VersionsDataSource.npmMetadata[currentCypressVersion.version] ?? new Date().toISOString(),
      },
    }
  }

  private async getVersionMetadata (): Promise<Record<string, string>> {
    const response = await this.ctx.util.fetch('https://registry.npmjs.org/cypress')
    const responseJson = await response.json()

    return responseJson.time
  }

  private async getLatestVersion ({ initialLaunch, testingType, currentCypressVersion }: GetLatestVersionOptions): Promise<string> {
    const url = REMOTE_MANIFEST_URL
    const id = await VersionsDataSource.machineId()

    const manifestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'x-cypress-version': currentCypressVersion,
      'x-os-name': os.platform(),
      'x-arch': os.arch(),
      'x-initial-launch': String(initialLaunch),
    }

    if (testingType) {
      manifestHeaders['x-testing-type'] = testingType
    }

    if (id) {
      manifestHeaders['x-machine-id'] = id
    }

    const manifestResponse = await this.ctx.util.fetch(url, {
      headers: manifestHeaders,
    })

    const manifest = await manifestResponse.json()

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
