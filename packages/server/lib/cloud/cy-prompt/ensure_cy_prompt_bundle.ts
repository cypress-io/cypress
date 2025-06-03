import { remove, ensureDir } from 'fs-extra'

import tar from 'tar'
import { getCyPromptBundle } from '../api/cy-prompt/get_cy_prompt_bundle'
import path from 'path'

interface EnsureCyPromptBundleOptions {
  cyPromptPath: string
  cyPromptUrl: string
  projectId?: string
}

export const ensureCyPromptBundle = async ({ cyPromptPath, cyPromptUrl, projectId }: EnsureCyPromptBundleOptions) => {
  const bundlePath = path.join(cyPromptPath, 'bundle.tar')

  // First remove cyPromptPath to ensure we have a clean slate
  await remove(cyPromptPath)
  await ensureDir(cyPromptPath)

  await getCyPromptBundle({
    cyPromptUrl,
    projectId,
    bundlePath,
  })

  await tar.extract({
    file: bundlePath,
    cwd: cyPromptPath,
  })
}
