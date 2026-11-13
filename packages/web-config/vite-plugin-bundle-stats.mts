import fs from 'fs/promises'
import path from 'path'
import { decode } from '@jridgewell/sourcemap-codec'
import type { BundleStats, BundleStatsModule } from './bundle-stats'

// Vite configs load this file as native ESM, which cannot import values from
// the CommonJS bundle-stats.ts, so the variable name is repeated here.
const BUNDLE_STATS_DIR_ENV = 'CYPRESS_INTERNAL_BUNDLE_STATS_DIR'

// The subset of Vite's plugin API this plugin uses. web-config resolves modules
// the CommonJS way, which cannot load Vite's ESM-only type declarations.
interface ViteSourceMap {
  sources: string[]
  sourceRoot?: string
  mappings: string
}

interface ViteBundleOutput {
  type: 'chunk' | 'asset'
  code?: string
  map?: ViteSourceMap | null
}

interface ViteUserConfig {
  build?: { sourcemap?: unknown }
}

interface VitePlugin {
  name: string
  apply: 'build'
  enforce: 'post'
  config: (config: ViteUserConfig) => ViteUserConfig | undefined
  configResolved: (config: { root: string, build: { outDir: string } }) => void
  writeBundle: (options: unknown, bundle: Record<string, ViteBundleOutput>) => Promise<void>
}

/**
 * Splits a chunk's final code between the modules it came from. Vite minifies
 * after modules are rendered, so the bundler's own per-module lengths overstate
 * what each module costs in the output; the source map does not.
 *
 * Within a line that has mappings, indentation, unmapped punctuation and the
 * newline go to the neighbouring mapped source. A line with no mappings, such
 * as a JSON module or a comment, goes to the module whose `//#region` marker
 * encloses it; Rolldown writes those markers only in unminified output, so
 * unmapped lines in minified output are left out and show up as unattributed.
 */
const attribute = (code: string, map: ViteSourceMap, chunkDir: string, projectRoot: string): BundleStatsModule[] => {
  const byId = new Map<string, string[]>()
  const sourcesRoot = path.resolve(chunkDir, map.sourceRoot ?? '')
  const toId = (source: string, root: string) => (source.startsWith('\0') ? source : path.resolve(root, source))
  const sourceIds = map.sources.map((source) => toId(source, sourcesRoot))
  const add = (id: string, text: string) => {
    const parts = byId.get(id) ?? []

    parts.push(text)
    byId.set(id, parts)
  }

  const mappings = decode(map.mappings)
  const lines = code.split('\n')
  let region: string | undefined

  lines.forEach((text, lineIndex) => {
    const line = lineIndex < lines.length - 1 ? `${text}\n` : text
    const segments = mappings[lineIndex] ?? []
    const first = segments.find((segment) => segment.length > 1)

    if (text.startsWith('//#region ')) region = toId(text.slice('//#region '.length), projectRoot)

    if (!first || first.length === 1) {
      if (region) add(region, line)
    } else {
      let source = first[1]

      segments.forEach((segment, i) => {
        if (segment.length !== 1) source = segment[1]

        add(sourceIds[source], line.slice(i === 0 ? 0 : segment[0], segments[i + 1]?.[0] ?? line.length))
      })
    }

    if (text.startsWith('//#endregion')) region = undefined
  })

  return [...byId].map(([id, parts]) => {
    const moduleCode = parts.join('')

    return { id, bytes: Buffer.byteLength(moduleCode), code: moduleCode }
  })
}

export const bundleStatsVitePlugin = (): VitePlugin | false => {
  const dir = process.env[BUNDLE_STATS_DIR_ENV]

  if (!dir) return false

  let outDir = ''
  let projectRoot = ''
  let keepMaps = false

  return {
    name: 'cypress:bundle-stats',
    apply: 'build',
    enforce: 'post',
    config (config) {
      keepMaps = Boolean(config.build?.sourcemap)

      // 'hidden' leaves the JS output byte-for-byte the same: no sourceMappingURL comment
      return keepMaps ? undefined : { build: { sourcemap: 'hidden' } }
    },
    configResolved (config) {
      projectRoot = config.root
      outDir = path.resolve(config.root, config.build.outDir)
    },
    async writeBundle (options, bundle) {
      const files: BundleStats['files'] = {}

      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type !== 'chunk' || !output.map || output.code === undefined) continue

        files[fileName] = attribute(output.code, output.map, path.dirname(path.join(outDir, fileName)), projectRoot)

        if (!keepMaps) await fs.rm(path.join(outDir, `${fileName}.map`), { force: true })
      }

      const stats: BundleStats = { bundler: 'vite', outDir, files }
      const name = `vite-${outDir}`.replace(/[^\w.+-]+/g, '_')

      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(path.join(dir, `${name}.json`), JSON.stringify(stats))
    },
  }
}
