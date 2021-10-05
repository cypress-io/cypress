import type { FullConfig } from '@packages/types'
import DataLoader from 'dataloader'
import fs from 'fs-extra'
import type { DataContext } from '..'
import { GitInfo, getGitInfo } from './util'

/**
 * Centralized location to load files. Allows us to consolidate
 * file watching & cache invalidation in a single location
 */
export class DataLoaders {
  constructor (private ctx: DataContext) {}

  private _allLoaders: DataLoader<any, any>[] = []

  file (fileName: string) {
    return this.fileLoader.load(fileName)
  }

  maybeFile (fileName: string) {
    return this.file(fileName).catch(() => null)
  }

  jsonFile<Result = unknown> (fileName: string) {
    return this.jsonFileLoader.load(fileName) as Promise<Result>
  }

  projectConfig (projectRoot: string) {
    return this.configLoader.load(projectRoot)
  }

  gitInfo (path: string) {
    return this.gitLoader.load(path)
  }

  private gitLoader = this.loader<string, GitInfo>((absolutePaths) => {
    return getGitInfo(absolutePaths)
  })

  private configLoader = this.loader<string, FullConfig>((projectRoots) => {
    return Promise.all(projectRoots.map((root) => this.ctx._apis.projectApi.getConfig(root)))
  })

  private fileLoader = this.loader<string, string>((files) => {
    return Promise.all(files.map((f) => fs.readFile(f, 'utf8')))
  })

  private jsonFileLoader = this.loader<string, unknown>(async (jsonFiles) => {
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

  private loader<K, V, C = K> (batchLoadFn: DataLoader.BatchLoadFn<K, V>) {
    const loader = new DataLoader<K, V, C>(batchLoadFn)

    this._allLoaders.push(loader)

    return loader
  }

  dispose () {
    for (const loader of this._allLoaders) {
      loader.clearAll()
    }
  }
}

export function makeLoaders (ctx: DataContext) {
  return new DataLoaders(ctx)
}
