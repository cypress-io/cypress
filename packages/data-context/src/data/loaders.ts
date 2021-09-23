import DataLoader from 'dataloader'
import fs from 'fs-extra'

export class DataLoaders {
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

  private fileLoader = new DataLoader<string, string>((files) => {
    return Promise.all(files.map((f) => fs.readFile(f, 'utf8')))
  })

  /**
   *
   */
  private jsonFileLoader = new DataLoader<string, unknown>(async (jsonFiles) => {
    return await Promise.all(jsonFiles.map((file) => {
      fs.readFile(file, 'utf8')
      .then((data) => JSON.parse(data))
      .catch((e) => {
        return e instanceof Error ? e : new Error(e)
      })
    }))
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

export function makeLoaders () {
  return new DataLoaders()
}
