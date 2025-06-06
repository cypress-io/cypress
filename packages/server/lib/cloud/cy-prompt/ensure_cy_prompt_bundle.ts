import { remove, ensureDir } from 'fs-extra'

import tar from 'tar'
import { getCyPromptBundle } from '../api/cy-prompt/get_cy_prompt_bundle'
import path from 'path'

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
export const ensureCyPromptBundle = async ({ cyPromptPath, cyPromptUrl, projectId, downloadTimeoutMs = DOWNLOAD_TIMEOUT }: EnsureCyPromptBundleOptions) => {
  const bundlePath = path.join(cyPromptPath, 'bundle.tar')

  // First remove cyPromptPath to ensure we have a clean slate
  await remove(cyPromptPath)
  await ensureDir(cyPromptPath)

  let timeoutId: NodeJS.Timeout

  await Promise.race([
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
  })

  await tar.extract({
    file: bundlePath,
    cwd: cyPromptPath,
  })
}
