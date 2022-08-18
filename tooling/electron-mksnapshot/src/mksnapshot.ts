import { attemptDownload } from './mksnapshot-download'
import { Metadata } from './metadata'

import debug from 'debug'
import { runMksnapshot } from './mksnapshot-run'
import type { VersionMeta } from './config'

const logInfo = debug('cypress:mksnapshot:info')
const logDebug = debug('cypress:mksnapshot:debug')
const logError = debug('cypress:mksnapshot:error')

export async function syncAndRun (version: string, args: string[]) {
  const metadata = new Metadata(version)

  if (metadata.matchesCurrentConfig()) {
    logDebug('Skipping download since the previous download is still current')
  } else {
    logInfo('Downloading snapshot binaries for version %s', version)

    try {
      await attemptDownload(version, false)
    } catch (err) {
      logError(
        'Failed to download version "%s" of the mksnapshot binaries',
        version,
      )

      logError(err)
    }
    // Successfully downloaded the binaries, let's update the metadata
    try {
      logDebug('Writing updated metadata %o', metadata.current())
      await metadata.write()
    } catch (err) {
      logError('Failed to write the updated metadata')
      logError(err)
    }
  }

  runMksnapshot(args)

  return metadata.current()
}

export function getMetadata (version: string): VersionMeta {
  return new Metadata(version).current()
}
