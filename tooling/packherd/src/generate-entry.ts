import path from 'path'

import type { Metafile } from 'esbuild'
import type { CreateBundle } from './types'
import { getMetadata } from './get-metadata'

const packherd = require('../package.json').name

export type PathsMapper = (s: string) => string

export const identityMapper: PathsMapper = (s: string) => s

/**
 * The EntryGenerator creates an entry file which includes all dependencies reachable from the [entryFilePath] but
 * flattened. This is helpful while diagnosing problems as it is easier to exclude a dependency simply by commenting it
 * out in the generated entry file. This entry file is then provided to packherd instead of the main app file when
 * generating the bundle.
 * Combined with the  `nodeModulesOnly` options allows to control which files are included in the bundle in the end that
 * way.
 *
 * @category Bundle
 */
export class EntryGenerator {
  private readonly entryDirectory: string

  /**
   * Creates an instance of the EntryGenerator.
   *
   * @param createBundle create bundle function which calls into esbuild
   * @param entryFilePath file that is the apps main entry and (in)directly references all app and node_modules
   * @param nodeModulesOnly if `true` only `node_modules` are included in the entry file
   * @param pathsMapper if provided the module paths are mapped with it
   *
   * @category Bundle
   */
  constructor (
    private readonly createBundle: CreateBundle,
    private readonly entryFile: string,
    private readonly nodeModulesOnly: boolean = true,
    private readonly pathsMapper: PathsMapper = identityMapper,
  ) {
    this.entryDirectory = path.dirname(entryFile)
  }

  async createEntryScript () {
    const meta = await this._getMetadata()

    // Make paths relative to the entry dir and sort them by name
    const relToCwdPaths = this._resolveRelativePaths(meta)

    relToCwdPaths.sort()

    const fullPaths = relToCwdPaths.map((x) => path.join(process.cwd(), x))
    const paths = fullPaths.map((x) => path.relative(this.entryDirectory, x)).map((x) => x.split(path.sep).join(path.posix.sep))

    const entry = ['// vim: set ft=text:']
    .concat(paths.map((x) => `exports['./${x}'] = require('./${x}')`))
    .join('\n')

    return { paths, entry }
  }

  private _getMetadata (): Promise<Metafile> {
    return getMetadata(this.createBundle, this.entryFile, this.entryDirectory)
  }

  private _resolveRelativePaths (meta: Metafile) {
    let relPaths = Object.keys(meta.inputs).filter((x) => !x.includes(packherd))

    if (this.nodeModulesOnly) {
      relPaths = relPaths.filter((x) => x.includes('node_modules'))
    }

    return relPaths
    .map((x) => x.replace(/^node_modules\//, './node_modules/'))
    .map(this.pathsMapper)
  }
}
