import { remove, ensureDir } from 'fs-extra'

import tar from 'tar'
import { getStudioBundle } from '../api/studio/get_studio_bundle'
import path from 'path'

interface EnsureStudioBundleOptions {
  studioUrl: string
  projectId?: string
  studioPath: string
  downloadTimeoutMs?: number
}

const DOWNLOAD_TIMEOUT = 30000

export const ensureStudioBundle = async ({ studioUrl, projectId, studioPath, downloadTimeoutMs = DOWNLOAD_TIMEOUT }: EnsureStudioBundleOptions) => {
  const bundlePath = path.join(studioPath, 'bundle.tar')

  // First remove cyPromptPath to ensure we have a clean slate
  await remove(studioPath)
  await ensureDir(studioPath)

  let timeoutId: NodeJS.Timeout

  await Promise.race([
    getStudioBundle({
      studioUrl,
      projectId,
      bundlePath,
    }),
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Studio bundle download timed out'))
      }, downloadTimeoutMs)
    }),
  ]).finally(() => {
    clearTimeout(timeoutId)
  })

  await tar.extract({
    file: bundlePath,
    cwd: studioPath,
  })
}
