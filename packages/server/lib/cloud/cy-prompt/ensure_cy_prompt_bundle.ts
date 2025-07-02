import { remove, ensureDir, readFile, pathExists } from 'fs-extra'

import tar from 'tar'
import { getCyPromptBundle } from '../api/cy-prompt/get_cy_prompt_bundle'
import path from 'path'
import { verifySignature } from '../encryption'

const DOWNLOAD_TIMEOUT = 30000

interface EnsureCyPromptBundleOptions {
  cyPromptPath: string
  cyPromptUrl: string
  projectId?: string
  downloadTimeoutMs?: number
}

/**
 * Ensures that the cy prompt bundle is downloaded and extracted into the given path
 * @param options - The options for the ensure cy prompt bundle operation
 * @param options.cyPromptPath - The path to extract the cy prompt bundle to
 * @param options.cyPromptUrl - The URL of the cy prompt bundle
 * @param options.projectId - The project ID of the cy prompt bundle
 * @param options.downloadTimeoutMs - The timeout for the cy prompt bundle download
 */
export const ensureCyPromptBundle = async ({ cyPromptPath, cyPromptUrl, projectId, downloadTimeoutMs = DOWNLOAD_TIMEOUT }: EnsureCyPromptBundleOptions): Promise<Record<string, string>> => {
  const bundlePath = path.join(cyPromptPath, 'bundle.tar')

  // First remove cyPromptPath to ensure we have a clean slate
  await remove(cyPromptPath)
  await ensureDir(cyPromptPath)

  let timeoutId: NodeJS.Timeout

  const responseManifestSignature: string = await Promise.race([
    getCyPromptBundle({
      cyPromptUrl,
      projectId,
      bundlePath,
    }),
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Cy prompt bundle download timed out'))
      }, downloadTimeoutMs)
    }),
  ]).finally(() => {
    clearTimeout(timeoutId)
  }) as string

  await tar.extract({
    file: bundlePath,
    cwd: cyPromptPath,
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
