import { remove, ensureDir, readFile, pathExists } from 'fs-extra'

import tar from 'tar'
import { getStudioBundle } from '../api/studio/get_studio_bundle'
import path from 'path'
import { verifySignature } from '../encryption'

interface EnsureStudioBundleOptions {
  studioUrl: string
  projectId?: string
  studioPath: string
  downloadTimeoutMs?: number
}

const DOWNLOAD_TIMEOUT = 30000

/**
 * Ensures that the studio bundle is downloaded and extracted into the given path
 * @param options - The options for the ensure studio bundle operation
 * @param options.studioUrl - The URL of the studio bundle
 * @param options.projectId - The project ID of the studio bundle
 * @param options.studioPath - The path to extract the studio bundle to
 * @param options.downloadTimeoutMs - The timeout for the download operation
 */
export const ensureStudioBundle = async ({
  studioUrl,
  projectId,
  studioPath,
  downloadTimeoutMs = DOWNLOAD_TIMEOUT,
}: EnsureStudioBundleOptions): Promise<Record<string, string>> => {
  const bundlePath = path.join(studioPath, 'bundle.tar')

  // First remove studioPath to ensure we have a clean slate
  await remove(studioPath)
  await ensureDir(studioPath)

  let timeoutId: NodeJS.Timeout

  const responseManifestSignature: string = await Promise.race([
    getStudioBundle({
      studioUrl,
      bundlePath,
    }),
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Studio bundle download timed out'))
      }, downloadTimeoutMs)
    }),
  ]).finally(() => {
    clearTimeout(timeoutId)
  }) as string

  await tar.extract({
    file: bundlePath,
    cwd: studioPath,
  })

  const manifestPath = path.join(studioPath, 'manifest.json')

  if (!(await pathExists(manifestPath))) {
    throw new Error('Unable to find studio manifest')
  }

  const manifestContents = await readFile(manifestPath, 'utf8')

  const verified = await verifySignature(manifestContents, responseManifestSignature)

  if (!verified) {
    throw new Error('Unable to verify studio signature')
  }

  return JSON.parse(manifestContents)
}
