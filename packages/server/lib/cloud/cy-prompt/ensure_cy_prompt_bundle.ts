import { ensureDir, readFile, pathExists, remove } from 'fs-extra'
import { getCyPromptBundle } from '../api/cy-prompt/get_cy_prompt_bundle'
import path from 'path'
import { verifySignature } from '../encryption'
import { extractAtomic } from '../extract_atomic'

interface EnsureCyPromptBundleOptions {
  cyPromptPath: string
  cyPromptUrl: string
  projectId?: string
}

/**
 * Ensures that the cy prompt bundle is downloaded and extracted into the given path
 * @param options - The options for the ensure cy prompt bundle operation
 * @param options.cyPromptPath - The path to extract the cy prompt bundle to
 * @param options.cyPromptUrl - The URL of the cy prompt bundle
 * @param options.projectId - The project ID of the cy prompt bundle
 */
export const ensureCyPromptBundle = async ({ cyPromptPath, cyPromptUrl, projectId }: EnsureCyPromptBundleOptions): Promise<Record<string, string>> => {
  const bundlePath = path.join(cyPromptPath, 'bundle.tar')

  await ensureDir(cyPromptPath)

  const uniqueBundlePath = `${bundlePath}-${Math.random().toString(36).substring(2, 15)}`
  const responseManifestSignature: string = await getCyPromptBundle({
    cyPromptUrl,
    projectId,
    bundlePath: uniqueBundlePath,
  })

  await extractAtomic(uniqueBundlePath, cyPromptPath).finally(async () => {
    await remove(uniqueBundlePath).catch(() => { /* ignore */ })
  })

  const manifestPath = path.join(cyPromptPath, 'manifest.json')

  if (!(await pathExists(manifestPath))) {
    throw new Error('Unable to find cy-prompt manifest')
  }

  const manifestContents = await readFile(manifestPath, 'utf8')

  const verified = await verifySignature(manifestContents, responseManifestSignature)

  if (!verified) {
    throw new Error('Unable to verify cy-prompt signature')
  }

  return JSON.parse(manifestContents)
}
