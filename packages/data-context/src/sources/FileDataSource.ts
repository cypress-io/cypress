import assert from 'assert'
import type { DataContext } from '..'
import * as path from 'path'
import os from 'os'

import globby, { GlobbyOptions } from 'globby'
import Debug from 'debug'
import { toPosix } from '../util/file'

const debug = Debug('cypress:data-context:sources:FileDataSource')

export const matchGlobs = async (globs: string | string[], globbyOptions?: GlobbyOptions) => {
  return await globby(globs, globbyOptions)
}

// Normalizes glob patterns relative to `cwd` so they can be passed to globby (or
// matched in-memory) consistently. If a pattern is prefixed with the working
// directory it is stripped, since the working directory path may contain
// characters that conflict with glob syntax (brackets, parentheses, etc.) and
// we scope the search via the `cwd` globby option instead. On win32 the patterns
// are converted to POSIX separators (globby can't work with backslashes).
export const normalizeGlobsForCwd = (cwd: string, glob: string | string[]): string[] => {
  const globs = ([] as string[]).concat(glob).map((globPattern) => {
    const workingDirectoryPrefix = path.join(cwd, path.sep)

    if (globPattern.startsWith(workingDirectoryPrefix)) {
      return globPattern.replace(workingDirectoryPrefix, '')
    }

    return globPattern
  })

  if (os.platform() === 'win32') {
    // globby can't work with backwards slashes
    // https://github.com/sindresorhus/globby/issues/179
    for (const i in globs) {
      const cur = globs[i]

      if (!cur) throw new Error('undefined glob received')

      globs[i] = toPosix(cur)
    }
  }

  return globs
}

export class FileDataSource {
  constructor (private ctx: DataContext) {}

  async checkIfFileExists (relativePath: string) {
    assert(this.ctx.currentProject, `Cannot checkIfFileExists without active project`)

    const filePath = path.join(this.ctx.currentProject, relativePath)

    try {
      return await this.ctx.fs.stat(filePath)
    } catch {
      return null
    }
  }

  async readFileInProject (relative: string) {
    assert(this.ctx.currentProject, `Cannot readFileInProject without active project`)

    return this.ctx.fs.readFile(path.join(this.ctx.currentProject, relative), 'utf-8')
  }

  async getFilesByGlob (cwd: string, glob: string | string[], globOptions: GlobbyOptions = {}): Promise<string[]> {
    const globs = normalizeGlobsForCwd(cwd, glob)

    const nodeModulesInGlobPath = ([] as string[]).concat(glob).some((globPattern) => globPattern.includes('node_modules'))
    const ignoreNodeModules = !!((cwd.includes('node_modules') || nodeModulesInGlobPath))
    const ignoreGlob = (globOptions.ignore ?? []).concat(ignoreNodeModules ? [] : '**/node_modules/**')

    try {
      debug('globbing pattern(s): %o', globs)
      debug('within directory: %s', cwd)

      const files = await matchGlobs(globs, { onlyFiles: true, absolute: true, cwd, ...globOptions, ignore: ignoreGlob })

      return files
    } catch (e) {
      if (!globOptions.suppressErrors) {
        // Log error and retry with filesystem errors suppressed - this allows us to find partial
        // results even if the glob search hits permission issues (#24109)
        debug('Error in getFilesByGlob %o, retrying with filesystem errors suppressed', e)

        return await this.getFilesByGlob(cwd, glob, { ...globOptions, suppressErrors: true })
      }

      debug('Non-suppressible error in getFilesByGlob %o', e)

      return []
    }
  }
}
