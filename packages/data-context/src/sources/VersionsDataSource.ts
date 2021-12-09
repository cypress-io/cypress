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
  static result: undefined | Promise<string>

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

    VersionsDataSource.result ??= execa(`npm`, [`view`, `cypress`, `time`, `--json`]).then((result) => result.stdout)

    const result = await VersionsDataSource.result

    const json = JSON.parse(result)

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
        released: json[currentCypressVersion.version] ?? new Date().toISOString(),
        id: currentCypressVersion.version,
      },
    }
  }
}
