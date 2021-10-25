import type { DataContext } from '..'
import * as path from 'path'
import type { FoundSpec, SpecFile } from '@packages/types'
import globby, { GlobbyOptions } from 'globby'

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

  readJsonFile<Result = unknown> (absoluteFilePath: string) {
    return this.jsonFileLoader.load(absoluteFilePath).catch((e) => {
      this.jsonFileLoader.clear(e)
      throw e
    }) as Promise<Result>
  }

  normalizeFileToFileParts (options: CreateFileParts): SpecFile {
    const parsed = path.parse(options.absolute)

    return {
      absolute: options.absolute,
      name: path.relative(options.searchFolder, options.absolute),
      relative: path.relative(options.projectRoot, options.absolute),
      baseName: parsed.base,
      fileName: parsed.base.split('.')[0] || '',
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

  async getFilesByGlob (glob: string | string[], globOptions?: GlobbyOptions) {
    const globs = (Array.isArray(glob) ? glob : [glob]).concat('!**/node_modules/**')

    try {
      const files = await globby(globs, { onlyFiles: true, absolute: true, ...globOptions })

      return files
    } catch (e) {
      return []
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
