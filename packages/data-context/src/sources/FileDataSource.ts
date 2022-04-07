import assert from 'assert'
import type { DataContext } from '..'
import * as path from 'path'
import globby, { GlobbyOptions } from 'globby'
import Debug from 'debug'
import { toPosix } from '../util/file'

const debug = Debug('cypress:data-context:sources:FileDataSource')

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

    return this.ctx.fs.readFileSync(path.join(this.ctx.currentProject, relative), 'utf-8')
  }

  async getFilesByGlob (cwd: string, glob: string | string[], globOptions?: GlobbyOptions) {
    const globs = ([] as string[]).concat(glob)

    const ignoreGlob = (globOptions?.ignore ?? []).concat('**/node_modules/**')

    if (process.platform === 'win32') {
      // globby can't work with backwards slashes
      // https://github.com/sindresorhus/globby/issues/179
      for (const i in globs) {
        const cur = globs[i]

        if (!cur) throw new Error('undefined glob received')

        globs[i] = toPosix(cur)
      }
    }

    try {
      const files = await globby(globs, { onlyFiles: true, absolute: true, cwd, ...globOptions, ignore: ignoreGlob })

      return files
    } catch (e) {
      debug('error in getFilesByGlob %o', e)

      return []
    }
  }
}
