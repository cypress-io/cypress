import { readFile } from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import Debug from 'debug'
import { verifySignature } from '../encryption'
import { walkFiles } from './walk_files'
import { isInsideDir } from './is_inside_dir'

const debug = Debug('cypress:server:cloud:bundles:verify-bundle-on-disk')

const MANIFEST_FILE = 'manifest.json'

// Signature sidecar written at publish time so a cached bundle can be re-verified offline.
export const MANIFEST_SIG_FILE = '.manifest-sig'

const sha256Hex = (buf: Buffer): string => crypto.createHash('sha256').update(buf).digest('hex')

/**
 * Verify a cached bundle against its signed manifest without hitting the network,
 * returning the parsed manifest or `null` if it is missing, fails verification, or
 * has been tampered with. Trust is anchored to the manifest signature (checked
 * against the embedded public key); the signed manifest then gates every file by
 * sha256 and acts as a strict allowlist.
 */
export const verifyBundleOnDisk = async (finalDir: string): Promise<Record<string, string> | null> => {
  let manifestText: string
  let signature: string

  try {
    manifestText = await readFile(path.join(finalDir, MANIFEST_FILE), 'utf8')
    signature = await readFile(path.join(finalDir, MANIFEST_SIG_FILE), 'utf8')
  } catch (err) {
    debug('no cached bundle to verify at %s: %o', finalDir, err)

    return null
  }

  if (!await verifySignature(manifestText, signature)) {
    debug('cached manifest signature failed to verify at %s', finalDir)

    return null
  }

  let manifest: Record<string, string>

  try {
    manifest = JSON.parse(manifestText)
  } catch {
    debug('cached manifest is not valid JSON at %s', finalDir)

    return null
  }

  if (typeof manifest !== 'object' || manifest === null) {
    return null
  }

  const expectedFiles = Object.entries(manifest)

  for (const [rel, expectedHash] of expectedFiles) {
    if (typeof expectedHash !== 'string') {
      debug('manifest entry %s has a non-string hash', rel)

      return null
    }

    const target = path.resolve(finalDir, rel)

    if (!isInsideDir(finalDir, target)) {
      debug('manifest entry escapes finalDir: %s', rel)

      return null
    }

    try {
      const actualHash = sha256Hex(await readFile(target))

      if (actualHash !== expectedHash) {
        debug('hash mismatch for cached file %s', rel)

        return null
      }
    } catch (err) {
      debug('cached file %s missing or unreadable: %o', rel, err)

      return null
    }
  }

  // The manifest and its signature sidecar are the only files not listed in the manifest.
  const allowed = new Set<string>([
    MANIFEST_FILE,
    MANIFEST_SIG_FILE,
    ...Object.keys(manifest),
  ].map((rel) => path.normalize(rel)))

  let onDisk: string[]

  try {
    onDisk = await walkFiles(finalDir)
  } catch (err) {
    debug('failed to walk cached bundle at %s: %o', finalDir, err)

    return null
  }

  for (const rel of onDisk) {
    if (!allowed.has(path.normalize(rel))) {
      debug('unexpected file in cached bundle (possible tampering): %s', rel)

      return null
    }
  }

  debug('cached bundle at %s verified (%d files)', finalDir, expectedFiles.length)

  return manifest
}
