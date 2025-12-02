import { remove, ensureDir, readFile, pathExists } from 'fs-extra'
import { getStudioBundle } from '../api/studio/get_studio_bundle'
import path from 'path'
import { verifySignature } from '../encryption'
import { extractAtomic } from '../extract_atomic'

interface EnsureStudioBundleOptions {
  studioUrl: string
  projectId?: string
  studioPath: string
}

/**
 * Ensures that the studio bundle is downloaded and extracted into the given path
 * @param options - The options for the ensure studio bundle operation
 * @param options.studioUrl - The URL of the studio bundle
 * @param options.projectId - The project ID of the studio bundle
 * @param options.studioPath - The path to extract the studio bundle to
 */
export const ensureStudioBundle = async ({
  studioUrl,
  projectId,
  studioPath,
}: EnsureStudioBundleOptions): Promise<Record<string, string>> => {
  const bundlePath = path.join(studioPath, 'bundle.tar')

  await ensureDir(studioPath)

  const uniqueBundlePath = `${bundlePath}-${Math.random().toString(36).substring(2, 15)}`
  const responseManifestSignature: string = await getStudioBundle({
    studioUrl,
    bundlePath: uniqueBundlePath,
  })

  await extractAtomic(uniqueBundlePath, studioPath).finally(async () => {
    await remove(uniqueBundlePath).catch(() => { /* ignore */ })
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
