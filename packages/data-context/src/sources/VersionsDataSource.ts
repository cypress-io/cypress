import execa from 'execa'
// import Debug from 'debug'

// const debug = Debug('cypress:data-context:versions-source')

// interface Version {
//   id: string
//   released: string
//   version: string
// }

// interface VersionData {
//   current: Version
//   latest: Version
// }

// const _getManifest = ({ id, initialLaunch, testingType }) => {
//   const url = konfig('desktop_manifest_url')

//   return rp.get({
//     url,
//     headers: {
//       'x-cypress-version': pkg.version,
//       'x-os-name': os.platform(),
//       'x-arch': os.arch(),
//       'x-machine-id': id,
//       'x-initial-launch': String(initialLaunch),
//       'x-testing-type': testingType,
//     },
//     agent,
//     proxy: null,
//     json: true,
//   })
// }

// const check = async ({ testingType, initialLaunch, onNewVersion, onNoNewVersion } = {}) => {
//   try {
//     const id = await machineId()
//     const manifest = await _getManifest({
//       id,
//       testingType,
//       initialLaunch,
//     })

//     if (!manifest || !manifest.version) {
//       throw new Error('manifest is empty or does not have a version')
//     }

//     debug('latest version of Cypress is:', manifest.version)

//     const localVersion = pkg.version
//     const newVersionAvailable = semver.gt(manifest.version, localVersion)

//     if (newVersionAvailable) {
//       debug('new version of Cypress exists:', manifest.version)
//       onNewVersion(manifest)
//     } else {
//       debug('new version of Cypress does not exist')
//       onNoNewVersion()
//     }
//   } catch (err) {
//     debug('error getting latest version of Cypress', err)
//     onNoNewVersion()
//   }
// }

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
