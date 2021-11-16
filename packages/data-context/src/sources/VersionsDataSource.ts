import execa from 'execa'

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
    const currentCypressVersion = require('cypress/package.json')
    const result = await execa(`npm`, [`view`, `cypress`, `time`, `--json`])

    const json = JSON.parse(result.stdout)

    delete json['modified']
    delete json['created']

    const latest = Object.keys(json).sort().reverse()?.[0]

    if (!latest) {
      throw Error('Could not get npm info for Cypress')
    }

    const latestVersion: Version = {
      id: latest,
      version: latest,
      released: json[latest],
    }

    return {
      latest: latestVersion,
      current: {
        version: currentCypressVersion.version,
        released: currentCypressVersion.version === '0.0.0-development' ? new Date().toISOString() : json[currentCypressVersion.version],
        id: currentCypressVersion.version,
      },
    }
  }
}
