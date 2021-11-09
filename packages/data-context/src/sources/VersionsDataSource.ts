import execa from 'execa'

interface Version {
  id: string
  released: string
  version: string
}

export class VersionsDataSource {
  /**
   * Returns most recent versions and release date as a timestamp.
   * [
   *   { version: '8.7.0', released: '2021-10-25T21:38:59.983Z' },
   *   { version: '8.6.0', released: '2021-10-11T19:40:49.036Z' },
   *   { version: '8.5.0', released: '2021-09-27T20:09:18.543Z' },
   *   { version: '8.4.1', released: '2021-09-17T21:36:14.149Z' },
   *   { version: '8.4.0', released: '2021-09-13T20:29:16.074Z' },
   * ]
   */
  async versions (n: number = 5): Promise<Version[]> {
    const result = await execa(`npm`, [`view`, `cypress`, `time`, `--json`])

    const json = JSON.parse(result.stdout)

    delete json['modified']
    delete json['created']

    const mostRecentN = Object.keys(json).sort().reverse().slice(0, n).map((version) => {
      return {
        id: version,
        version,
        released: json[version],
      }
    })

    return mostRecentN
  }
}
