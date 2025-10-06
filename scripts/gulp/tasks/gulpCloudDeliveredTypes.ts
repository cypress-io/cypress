process.env.CYPRESS_INTERNAL_ENV = process.env.CYPRESS_INTERNAL_ENV ?? 'production'

import path from 'path'
import fs from 'fs-extra'
import { postStudioSession } from '@packages/server/lib/cloud/api/studio/post_studio_session'
import os from 'os'
import { ensureStudioBundle } from '@packages/server/lib/cloud/studio/ensure_studio_bundle'
import { postCyPromptSession } from '@packages/server/lib/cloud/api/cy-prompt/post_cy_prompt_session'
import { ensureCyPromptBundle } from '@packages/server/lib/cloud/cy-prompt/ensure_cy_prompt_bundle'

interface TypeFileMapping {
  sourcePath: string
  destinationPath: string
}

interface BundleConfig {
  name: string
  envVar: string
  sessionFunction: () => Promise<{ studioUrl?: string, cyPromptUrl?: string }>
  ensureBundleFunction: (url: string, bundlePath: string) => Promise<void>
  typeMappings: TypeFileMapping[]
}

const getBundlePath = (url: string, bundleName: string): string => {
  const hash = url.split('/').pop()?.split('.')[0]

  if (!hash) {
    throw new Error(`Could not extract hash from URL: ${url}`)
  }

  return path.join(os.tmpdir(), 'cypress', bundleName, hash)
}

const copyTypeFiles = async (sourceBasePath: string, typeMappings: TypeFileMapping[]): Promise<void> => {
  for (const mapping of typeMappings) {
    await fs.copyFile(
      path.join(sourceBasePath, mapping.sourcePath),
      mapping.destinationPath,
    )
  }
}

const downloadBundleTypes = async (config: BundleConfig): Promise<void> => {
  const { name, envVar, sessionFunction, ensureBundleFunction, typeMappings } = config

  if (!process.env[envVar]) {
    const session = await sessionFunction()
    const url = session.studioUrl || session.cyPromptUrl

    if (!url) {
      throw new Error(`No URL returned from ${name} session`)
    }

    const bundlePath = getBundlePath(url, name)

    await ensureBundleFunction(url, bundlePath)

    await copyTypeFiles(bundlePath, typeMappings)
  } else {
    const localPath = process.env[envVar]

    if (!localPath) {
      throw new Error(`Environment variable ${envVar} is not set`)
    }

    await copyTypeFiles(localPath, typeMappings)
  }
}

const createTypeMappings = (baseDir: string): TypeFileMapping[] => {
  return [
    {
      sourcePath: 'app/types.ts',
      destinationPath: path.join(baseDir, 'packages', 'app', 'src', 'studio', 'studio-app-types.ts'),
    },
    {
      sourcePath: 'server/types.ts',
      destinationPath: path.join(baseDir, 'packages', 'types', 'src', 'studio', 'studio-server-types.ts'),
    },
  ]
}

const createPromptTypeMappings = (baseDir: string): TypeFileMapping[] => {
  return [
    {
      sourcePath: 'app/types.ts',
      destinationPath: path.join(baseDir, 'packages', 'app', 'src', 'prompt', 'prompt-app-types.ts'),
    },
    {
      sourcePath: 'driver/types.ts',
      destinationPath: path.join(baseDir, 'packages', 'driver', 'src', 'cy', 'commands', 'prompt', 'prompt-driver-types.ts'),
    },
    {
      sourcePath: 'server/types.ts',
      destinationPath: path.join(baseDir, 'packages', 'types', 'src', 'cy-prompt', 'cy-prompt-server-types.ts'),
    },
  ]
}

export const downloadStudioTypes = async (): Promise<void> => {
  const baseDir = path.join(__dirname, '..', '..', '..')

  const studioConfig: BundleConfig = {
    name: 'studio',
    envVar: 'CYPRESS_LOCAL_STUDIO_PATH',
    sessionFunction: () => postStudioSession({ projectId: 'ypt4pf' }),
    ensureBundleFunction: (url: string, bundlePath: string) => ensureStudioBundle({ studioUrl: url, studioPath: bundlePath, projectId: 'ypt4pf' }),
    typeMappings: createTypeMappings(baseDir),
  }

  await downloadBundleTypes(studioConfig)
}

export const downloadPromptTypes = async (): Promise<void> => {
  const baseDir = path.join(__dirname, '..', '..', '..')

  const promptConfig: BundleConfig = {
    name: 'cy-prompt',
    envVar: 'CYPRESS_LOCAL_CY_PROMPT_PATH',
    sessionFunction: () => postCyPromptSession({ projectId: 'ypt4pf' }),
    ensureBundleFunction: (url: string, bundlePath: string) => ensureCyPromptBundle({ cyPromptUrl: url, cyPromptPath: bundlePath, projectId: 'ypt4pf' }),
    typeMappings: createPromptTypeMappings(baseDir),
  }

  await downloadBundleTypes(promptConfig)
}
