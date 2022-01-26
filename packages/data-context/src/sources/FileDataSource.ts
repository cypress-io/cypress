import assert from 'assert'
import type { DataContext } from '..'
import * as path from 'path'
import globby, { GlobbyOptions } from 'globby'
import type { FoundSpec, SpecFile } from '@packages/types'
import Debug from 'debug'
import { toPosix } from '../util/file'

const debug = Debug('cypress:data-context:sources:FileDataSource')

interface CreateFileParts {
  absolute: string
  projectRoot: string
  searchFolder: string
}

interface CreateFoundSpec extends CreateFileParts {
  specFileExtension: string
  specType: FoundSpec['specType']
}

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

  normalizeFileToFileParts (options: CreateFileParts): SpecFile & { fileExtension: string } {
    const parsed = path.parse(options.absolute)

    return {
      absolute: options.absolute,
      name: path.relative(options.searchFolder, options.absolute),
      relative: path.relative(options.projectRoot, options.absolute),
      baseName: parsed.base,
      fileName: parsed.base.split('.')[0] || '',
      fileExtension: parsed.ext,
    }
  }

  normalizeFileToSpec (options: CreateFoundSpec): FoundSpec {
    return {
      ...this.normalizeFileToFileParts(options),
      specFileExtension: options.specFileExtension,
      specType: options.specType,
      fileExtension: this.ctx.path.parse(options.absolute).ext,
    }
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

  private trackFile () {
    // this.watchedFilePaths.clear()
    // this.fileLoader.clear()
    // this.jsonFileLoader.clear()
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
