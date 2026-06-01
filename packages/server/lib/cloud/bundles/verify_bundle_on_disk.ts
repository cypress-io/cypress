import { readFile } from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import Debug from 'debug'
import { verifySignature } from '../encryption'
import { walkFiles } from './walk_files'

const debug = Debug('cypress:server:cloud:bundles:verify-bundle-on-disk')

export const MANIFEST_FILE = 'manifest.json'

// Sidecar holding the manifest signature received in the download response
// headers. Persisted at publish time so a later process can re-verify a cached
// bundle entirely offline. Not part of the signed manifest itself.
export const MANIFEST_SIG_FILE = '.manifest-sig'

const sha256Hex = (buf: Buffer): string => crypto.createHash('sha256').update(buf).digest('hex')

const isInsideDir = (parent: string, child: string): boolean => {
  const rel = path.relative(parent, child)

  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)
}

/**
 * Verify that the bundle already cached at `finalDir` is byte-for-byte what
 * Cypress signed — without touching the network. Returns the parsed manifest on
 * success, or `null` if anything is missing, fails to verify, or looks tampered.
 *
 * The trust chain is anchored to the manifest signature (verified against the
 * embedded public key). The signed manifest enumerates every file with its
 * sha256, so we (1) verify the signature, (2) re-hash every listed file, and
 * (3) enforce the manifest as a strict allowlist — any unexpected file on disk
 * is treated as tampering. This lets us safely skip re-downloading while
 * guaranteeing nothing untrusted can be substituted on disk and loaded.
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

  // Verify every file the (now-trusted) manifest enumerates matches its hash.
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

  // Strict allowlist: reject anything on disk the manifest doesn't account for.
  // Allowed extras are the manifest file itself and our signature sidecar.
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
