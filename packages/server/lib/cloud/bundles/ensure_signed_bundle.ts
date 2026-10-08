import { ensureDir, readFile, remove, writeFile } from 'fs-extra'
import path from 'path'
import Debug from 'debug'
import { verifySignature } from '../encryption'
import { ensureWritableBundleCacheDir, ensureWritableFallbackBundleCacheDir, getFallbackBundleCacheDir, isPermissionError } from './cache_root'
import { parseHashFromBundleUrl } from './parse_hash_from_bundle_url'
import { sweepOrphanStaging } from './sweep_orphan_staging'
import { streamDownloadVerifyExtract } from './stream_download_verify_extract'
import { publishStagingToFinal } from './publish_staging_to_final'
import { verifyBundleOnDisk, MANIFEST_SIG_FILE } from './verify_bundle_on_disk'
import type { BundleKind } from './bundle_error'
import { BundleError } from './bundle_error'

const debug = Debug('cypress:server:cloud:bundles:ensure-signed-bundle')

const ORPHAN_STAGING_TTL_MS = 60 * 60 * 1000
const STAGING_PREFIX = '.staging-'

interface EnsureSignedBundleOptions {
  url: string
  projectId?: string
  kind: BundleKind
}

interface EnsureSignedBundleResult {
  manifest: Record<string, string>
  bundleDir: string
}

const randomSuffix = (): string => Math.random().toString(36).substring(2, 15)

// EBUSY is what renameAtomicWithRetry gives up on when a Windows antivirus or
// indexer lock outlasts its short retries.
const shouldFallBackToTmpDir = (err: unknown): err is NodeJS.ErrnoException => {
  return isPermissionError(err) || (err instanceof Error && 'code' in err && err.code === 'EBUSY')
}

const ensureSignedBundleIn = async (baseDir: string, {
  url,
  projectId,
  kind,
}: EnsureSignedBundleOptions): Promise<EnsureSignedBundleResult> => {
  const hash = parseHashFromBundleUrl(url)
  const finalDir = path.join(baseDir, hash)
  const staging = path.join(baseDir, `${STAGING_PREFIX}${randomSuffix()}`)

  debug('ensuring %s bundle hash=%s baseDir=%s', kind, hash, baseDir)

  // Reuse an already-cached bundle that still verifies, skipping download and publish.
  const cachedManifest = await verifyBundleOnDisk(finalDir).catch(() => null)

  if (cachedManifest) {
    debug('%s bundle cache hit hash=%s', kind, hash)

    return { manifest: cachedManifest, bundleDir: finalDir }
  }

  await ensureDir(finalDir)

  const sweptCount = await sweepOrphanStaging(baseDir, ORPHAN_STAGING_TTL_MS).catch(() => 0)

  if (sweptCount > 0) debug('swept %d orphan staging dir(s) under %s', sweptCount, baseDir)

  try {
    const manifestSig = await streamDownloadVerifyExtract({ url, projectId, staging, kind })

    const manifestPath = path.join(staging, 'manifest.json')
    let manifestText: string

    try {
      manifestText = await readFile(manifestPath, 'utf8')
    } catch (err: any) {
      throw new BundleError({
        kind,
        stage: 'manifest',
        message: `Unable to read ${kind} manifest from staging`,
        cause: err,
      })
    }

    const verified = await verifySignature(manifestText, manifestSig)

    if (!verified) {
      throw new BundleError({
        kind,
        stage: 'manifest',
        message: `Unable to verify ${kind} manifest signature`,
      })
    }

    // Persist the signature before publish so it lands before manifest.json (the
    // commit marker) and is always present whenever manifest.json is.
    await writeFile(path.join(staging, MANIFEST_SIG_FILE), manifestSig, 'utf8')

    try {
      await publishStagingToFinal(staging, finalDir)
    } catch (err: any) {
      throw new BundleError({
        kind,
        stage: 'publish',
        message: `Failed to publish ${kind} bundle from staging to ${finalDir}`,
        cause: err,
      })
    }

    debug('%s bundle published to %s', kind, finalDir)

    return {
      manifest: JSON.parse(manifestText) as Record<string, string>,
      bundleDir: finalDir,
    }
  } finally {
    await remove(staging).catch(() => { /* ignore */ })
  }
}

export const ensureSignedBundle = async (options: EnsureSignedBundleOptions): Promise<EnsureSignedBundleResult> => {
  const { kind } = options
  const baseDir = await ensureWritableBundleCacheDir(kind)

  try {
    return await ensureSignedBundleIn(baseDir, options)
  } catch (err) {
    // The cache dir passed the writability probe, but can still turn unwritable
    // afterwards (another process, a read-only remount, an antivirus or indexer
    // lock on Windows). Retry the whole attempt once in the OS temp dir rather
    // than failing — the staging dir lives under baseDir, so a partial publish
    // can't just be moved across, as the temp dir is often a different volume.
    if (!shouldFallBackToTmpDir(err) || baseDir === getFallbackBundleCacheDir(kind)) throw err

    debug('%s bundle write failed under %s (%s); retrying in OS temp dir', kind, baseDir, err.code)

    return ensureSignedBundleIn(await ensureWritableFallbackBundleCacheDir(kind), options)
  }
}
