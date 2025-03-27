import { strict as assert } from 'assert'
import debug from 'debug'
import fs from 'fs'
import { assembleScript } from '../generator/create-snapshot-script'
import { SnapshotVerifier } from '../generator/snapshot-verifier'
import type { ProcessScriptOpts, ProcessScriptResult } from '../types'
import { createHash } from '../utils'

process.env.DEBUG_COLOR = '1'

const logInfo = debug('cypress:snapgen:info')

const bundleState: { contents?: Buffer, hash?: string } = {
  contents: undefined,
  hash: undefined,
}

function getBundle (bundlePath?: string, bundleHash?: string) {
  assert(
    bundlePath != null,
    'either bundle content or path need to be provided',
  )

  assert(
    bundleHash != null,
    'either bundle content or hash need to be provided',
  )

  if (
    bundleState.hash == null ||
    bundleState.contents == null ||
    bundleState.hash !== bundleHash
  ) {
    logInfo('AsyncScriptProcessor is reading updated bundle file')
    const contents = fs.readFileSync(bundlePath)
    const hash = createHash(contents)

    assert(hash === bundleHash, 'bundle should not change while processing')

    bundleState.contents = contents
    bundleState.hash = hash
  }

  return bundleState.contents
}

const snapshotVerifier = new SnapshotVerifier()

/**
 * Assembles a script from the provided bundle using the provided `entryPoint`
 * and verifies it.
 *
 * The same bundle is used to determine _healthyness_ of different modules in
 * parallel by providing a different entry point for each worker.
 *
 * This worker process stores the bundle content from the previous call and
 * only loads it from the file system again if the `bundleHash` changed.
 *
 * @param bundlePath path to the bundle to process
 * @param bundleHash the hash of that bundle
 * @param baseDirPath base dir of the project we're snapshotting
 * @param entryFilepath the path to the file to use as the entry to the app
 * direct/indirect dependents are either included directly or a discoverable by
 * following the imports present
 * @param entryPoint the entry file to use during verification
 * @param nodeEnv the string to provide to `process.env.NODE_ENV` during
 * script verification
 * @param cypressInternalEnv the string to provide to `process.env.CYPRESS_INTERNAL_ENV`
 * during script verification
 */
export function processScript ({
  bundlePath,
  bundleHash,
  baseDirPath,
  entryFilePath,
  entryPoint,
  nodeEnv,
  cypressInternalEnv,
  supportTypeScript,
  integrityCheckSource,
}: ProcessScriptOpts): ProcessScriptResult {
  const bundleContent = getBundle(bundlePath, bundleHash)
  let snapshotScript

  try {
    snapshotScript = assembleScript(bundleContent, baseDirPath, entryFilePath, {
      entryPoint,
      includeStrictVerifiers: true,
      nodeEnv,
      cypressInternalEnv,
      baseSourcemapExternalPath: undefined,
      processedSourcemapExternalPath: undefined,
      supportTypeScript,
      integrityCheckSource,
    }).script
  } catch (err: any) {
    return { outcome: 'failed:assembleScript', error: err }
  }

  try {
    snapshotVerifier.verify(snapshotScript, `<snapshot:entry:${entryPoint}>`)
  } catch (err: any) {
    return { outcome: 'failed:verifyScript', error: err }
  }

  return { outcome: 'completed' }
}
