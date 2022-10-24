import debug from 'debug'
import path from 'path'
import { promises as fs } from 'fs'
import { createBundleAsync } from './create-snapshot-script'
import type { CreateBundleOpts, Metadata } from '../types'
import { getBundlerPath } from '../utils'

const snapshotUtils = require('../../package.json').name
const logInfo = debug('cypress:snapgen:info')
const logError = debug('cypress:snapgen:error')

type PathsMapper = (s: string) => string
const identityMapper: PathsMapper = (s: string) => s

class SnapshotEntryGeneratorViaWalk {
  readonly bundlerPath: string
  constructor (
    readonly entryFile: string,
    readonly projectBaseDir: string,
    readonly fullPathToSnapshotEntry: string,
    readonly nodeModulesOnly: boolean,
    readonly pathsMapper: PathsMapper,
  ) {
    this.bundlerPath = getBundlerPath()
  }

  async createSnapshotScript () {
    const meta = await this.getMetadata()
    const paths = this._resolveRelativePaths(meta)

    paths.sort()

    return paths
    .map((x) => x.replace(/\\/g, '/'))
    .map((x) => `exports['${x}'] = require('${x}')`)
    .join('\n')
  }

  private _resolveRelativePaths (meta: Metadata) {
    let fullPaths = Object.values(meta.inputs)
    .map((x) => x.fileInfo.fullPath)
    .filter((x) => !x.includes(`/${snapshotUtils}/`))

    if (this.nodeModulesOnly) {
      fullPaths = fullPaths.filter((x) => x.includes('node_modules'))
    }

    return fullPaths
    .map((x) => path.relative(path.dirname(this.fullPathToSnapshotEntry), x))
    .map((x) => x.replace(/^node_modules\//, './node_modules/'))
    .map(this.pathsMapper)
  }

  async getMetadata (): Promise<Metadata> {
    const opts: CreateBundleOpts = {
      bundlerPath: this.bundlerPath,
      baseDirPath: this.projectBaseDir,
      entryFilePath: this.entryFile,
      nodeModulesOnly: this.nodeModulesOnly,
      sourcemap: false,
      supportTypeScript: this.nodeModulesOnly,
    }
    const { meta } = await createBundleAsync(opts)

    return meta as Metadata
  }
}

const DEFAULT_GENERATE_CONFIG: Partial<GenerateDepsDataOpts> & {
  nodeModulesOnly: boolean
  pathsMapper: PathsMapper
} = {
  nodeModulesOnly: true,
  pathsMapper: identityMapper,
}

type GenerateDepsDataOpts = {
  entryFile: string
  nodeModulesOnly?: boolean
  pathsMapper?: PathsMapper
}

export type BundlerMetadata = Metadata & { projectBaseDir: string }

export async function generateBundlerMetadata (
  projectBaseDir: string,
  fullPathToSnapshotEntry: string,
  config: GenerateDepsDataOpts,
): Promise<BundlerMetadata> {
  const fullConf = Object.assign({}, DEFAULT_GENERATE_CONFIG, config)
  const generator = new SnapshotEntryGeneratorViaWalk(
    fullConf.entryFile,
    projectBaseDir,
    fullPathToSnapshotEntry,
    fullConf.nodeModulesOnly,
    fullConf.pathsMapper,
  )
  const meta = await generator.getMetadata()

  return { ...meta, projectBaseDir }
}

/**
 * Obtains all dependencies via `esbuild` metadata
 *
 * @param projectRoot root of the project whose dependencies we are collecting
 * @param fullPathToSnapshotEntry path to the file to which to write the
 * snapshot entry which will include all deps
 * @param partial_opts
 */
export async function generateSnapshotEntryFromEntryDependencies (
  projectBaseDir: string,
  fullPathToSnapshotEntry: string,
  config: GenerateDepsDataOpts,
) {
  const fullConf = Object.assign({}, DEFAULT_GENERATE_CONFIG, config)
  const generator = new SnapshotEntryGeneratorViaWalk(
    fullConf.entryFile,
    projectBaseDir,
    fullPathToSnapshotEntry,
    fullConf.nodeModulesOnly,
    fullConf.pathsMapper,
  )

  try {
    const script = await generator.createSnapshotScript()

    logInfo(
      'Writing snapshot script (len: %s) to "%s"',
      script.length,
      fullPathToSnapshotEntry,
    )

    await fs.writeFile(fullPathToSnapshotEntry, script, 'utf8')
  } catch (err) {
    logError(err)
  }
}
