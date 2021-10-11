import type { DataContext } from '..'
import * as path from 'path'
import type { SpecFile } from '@packages/types'

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

  normalizeFileToSpec (absolute: string, projectRoot: string, searchFolder: string): SpecFile {
    const parsed = path.parse(absolute)

    return {
      absolute,
      name: path.relative(searchFolder, absolute),
      relative: path.relative(projectRoot, absolute),
      baseName: parsed.base,
      fileName: parsed.base.split('.')[0] || '',
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
