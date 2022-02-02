import assert from 'assert'
import type { DataContext } from '..'
import * as path from 'path'
import globby, { GlobbyOptions } from 'globby'
import Debug from 'debug'
import { toPosix } from '../util/file'

const debug = Debug('cypress:data-context:sources:FileDataSource')

export class FileDataSource {
  constructor (private ctx: DataContext) {}

  readFile (absoluteFilePath: string) {
    return this.fileLoader.load(absoluteFilePath).catch((e) => {
      this.fileLoader.clear(absoluteFilePath)
      throw e
    })
  }

  readFileInProject (relativeFilePath: string) {
    assert(this.ctx.currentProject, 'Cannot readFileInProject without currentProject')

    return this.readFile(path.join(this.ctx.currentProject, relativeFilePath))
  }

  readJsonFile<Result = unknown> (absoluteFilePath: string) {
    return this.jsonFileLoader.load(absoluteFilePath).catch((e) => {
      this.jsonFileLoader.clear(e)
      throw e
    }) as Promise<Result>
  }

  async getFilesByGlob (cwd: string, glob: string | string[], globOptions?: GlobbyOptions) {
    const globs = (Array.isArray(glob) ? glob : [glob]).concat('!**/node_modules/**')

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
      const files = await globby(globs, { onlyFiles: true, absolute: true, cwd, ...globOptions })

      return files
    } catch (e) {
      debug('error in getFilesByGlob %o', e)

      return []
    }
  }

  isValidJsFile (absolutePath: string) {
    try {
      require(absolutePath)

      return true
    } catch {
      return false
    }
  }

  private fileLoader = this.ctx.loader<string, string>((files) => {
    return this.ctx.util.settleAll(files.map((f) => this.ctx.fs.readFile(f, 'utf8')))
  })

  private jsonFileLoader = this.ctx.loader<string, unknown>(async (jsonFiles) => {
    const files = await this.fileLoader.loadMany(jsonFiles)

    return files.map((file) => {
      if (file instanceof Error) {
        return file
      }

      try {
        return JSON.parse(file)
      } catch (e) {
        return e
      }
    })
  })
}
