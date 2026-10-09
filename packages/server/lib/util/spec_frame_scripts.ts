import path from 'path'
import { getCtx } from '@packages/data-context'
import type { Cfg } from '../project-base'

// The spec frame only ever asks the preprocessor for the support file and the
// project's specs. Anything else was named by someone other than the runner.
export const isSpecFrameScript = (config: Cfg, filePath: string): boolean => {
  const { projectRoot, supportFile } = config
  const target = path.resolve(projectRoot, filePath)

  if (supportFile && path.resolve(projectRoot, supportFile) === target) {
    return true
  }

  return getCtx().project.specs.some(({ absolute }) => path.resolve(projectRoot, absolute) === target)
}

export class NotSpecFrameScriptError extends Error {
  constructor (filePath: string) {
    const message = `${filePath} is not a spec file or the support file of this project.`

    super(message)
    this.name = 'NotSpecFrameScriptError'
    this.stack = message
  }
}
