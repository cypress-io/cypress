import fs from 'fs/promises'
import path from 'path'
import type { Compiler, Module } from 'webpack'

/**
 * Directory that bundle stats are written to. When it is unset, neither this
 * plugin nor vite-plugin-bundle-stats.mts does anything, so normal builds are
 * unchanged. Set by `yarn bundle-report`.
 */
export const BUNDLE_STATS_DIR_ENV = 'CYPRESS_INTERNAL_BUNDLE_STATS_DIR'

export interface BundleStatsModule {
  /** Absolute path of the module's resource, or the bundler's id for virtual modules */
  id: string
  /** Bytes the bundler attributes to this module in the output file */
  bytes: number
  code: string
}

export interface BundleStats {
  bundler: 'vite' | 'webpack'
  /** Absolute path of the directory the output files are written to */
  outDir: string
  /** JS output file, relative to outDir, mapped to the modules rendered into it */
  files: Record<string, BundleStatsModule[]>
}

const writeStats = async (name: string, stats: BundleStats) => {
  const dir = process.env[BUNDLE_STATS_DIR_ENV]

  if (!dir) return

  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, `${name}.json`), JSON.stringify(stats))
}

const statsName = (bundler: BundleStats['bundler'], outDir: string, suffix: string) => {
  return `${bundler}-${outDir}-${suffix}`.replace(/[^\w.+-]+/g, '_')
}

const collectWebpackModules = (module: Module, out: BundleStatsModule[]) => {
  // A ConcatenatedModule holds the modules it was built from
  if ('modules' in module && module.modules instanceof Set) {
    for (const inner of module.modules) collectWebpackModules(inner, out)

    return
  }

  if (!module.getSourceTypes().has('javascript')) return

  out.push({
    id: module.nameForCondition() ?? module.identifier(),
    bytes: module.size('javascript'),
    code: module.originalSource()?.source().toString() ?? '',
  })
}

export class BundleStatsWebpackPlugin {
  apply (compiler: Compiler) {
    if (!process.env[BUNDLE_STATS_DIR_ENV]) return

    compiler.hooks.afterEmit.tapPromise('cypress:bundle-stats', async (compilation) => {
      const outDir = compilation.outputOptions.path ?? compiler.context
      const files: BundleStats['files'] = {}

      for (const chunk of compilation.chunks) {
        const modules: BundleStatsModule[] = []

        for (const module of compilation.chunkGraph.getChunkModulesIterable(chunk)) {
          collectWebpackModules(module, modules)
        }

        for (const file of chunk.files) {
          if (file.endsWith('.js')) files[file] = [...(files[file] ?? []), ...modules]
        }
      }

      await writeStats(statsName('webpack', outDir, Object.keys(files).sort().join('+')), { bundler: 'webpack', outDir, files })
    })
  }
}
