import assert from 'assert'
import type { DataContext } from '..'
import * as path from 'path'
import globby, { GlobbyOptions } from 'globby'

export class FileDataSource {
  private watchedFilePaths = new Set<string>()

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

    try {
      const files = await globby(globs, { onlyFiles: true, absolute: true, cwd, ...globOptions })

      return files
    } catch (e) {
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
