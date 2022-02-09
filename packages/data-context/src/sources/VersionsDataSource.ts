import os from 'os'
import execa from 'execa'
import getenv from 'getenv'
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

const cloudEnv = getenv('CYPRESS_INTERNAL_CLOUD_ENV', process.env.CYPRESS_INTERNAL_ENV || 'development') as keyof typeof REMOTE_MANIFEST_URLS

// TODO: Is this what we want or are we still using konfig for this?
const REMOTE_MANIFEST_URLS = {
  staging: 'https://download.cypress.io/desktop.json',
  development: 'https://download.cypress.io/desktop.json',
  production: 'https://download.cypress.io/desktop.json',
}

const machineId = async (): Promise<string | undefined> => {
  try {
    return nmi.machineId()
  } catch (error) {
    return undefined
  }
}

type GetLatestVersionOptions = { initialLaunch: boolean, testingType: TestingType | null, currentCypressVersion: string }

export class VersionsDataSource {
  constructor (private ctx: DataContext) {}

  static npmMetadata: undefined | Promise<string>

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

    VersionsDataSource.npmMetadata ??= execa(`npm`, [`view`, `cypress`, `time`, `--json`]).then((result) => result.stdout)

    const npmMetadata = await VersionsDataSource.npmMetadata

    const json = JSON.parse(npmMetadata)

    delete json['modified']
    delete json['created']

    const latestVersionMetadata: Version = {
      id: latestVersion,
      version: latestVersion,
      released: json[latestVersion],
    }

    return {
      latest: latestVersionMetadata,
      current: {
        version: currentCypressVersion.version,
        released: json[currentCypressVersion.version] ?? new Date().toISOString(),
        id: currentCypressVersion.version,
      },
    }
  }

  private async getLatestVersion ({ initialLaunch, testingType, currentCypressVersion }: GetLatestVersionOptions): Promise<string> {
    const url = REMOTE_MANIFEST_URLS[cloudEnv]
    const id = await machineId()

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
}
