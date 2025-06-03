import { copy, remove, ensureDir } from 'fs-extra'

import tar from 'tar'
import { getCyPromptBundle } from '../api/cy-prompt/get_cy_prompt_bundle'
import path from 'path'

interface EnsureCyPromptBundleOptions {
  cyPromptPath: string
  cyPromptUrl: string
  projectId?: string
  bundlePath: string
}

export const ensureCyPromptBundle = async ({ cyPromptPath, cyPromptUrl, projectId, bundlePath }: EnsureCyPromptBundleOptions) => {
  // First remove cyPromptPath to ensure we have a clean slate
  await remove(cyPromptPath)
  await ensureDir(cyPromptPath)

  if (!process.env.CYPRESS_LOCAL_CY_PROMPT_PATH) {
    await getCyPromptBundle({
      cyPromptUrl,
      projectId,
      bundlePath,
    })

    await tar.extract({
      file: bundlePath,
      cwd: cyPromptPath,
    })
  } else {
    const driverPath = path.join(process.env.CYPRESS_LOCAL_CY_PROMPT_PATH, 'driver')
    const serverPath = path.join(process.env.CYPRESS_LOCAL_CY_PROMPT_PATH, 'server')

    await copy(driverPath, path.join(cyPromptPath, 'driver'))
    await copy(serverPath, path.join(cyPromptPath, 'server'))
  }
}
