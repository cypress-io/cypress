import { spawnSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import zlib from 'zlib'
import { BUNDLE_STATS_DIR_ENV } from '../packages/web-config/bundle-stats'
import type { BundleStats, BundleStatsModule } from '../packages/web-config/bundle-stats'

const USAGE = `Usage: yarn bundle-report [--skip-build] [--json]

Builds packages/app, packages/launchpad and packages/runner with module stats
enabled, then prints JS and CSS bytes (raw and gzip) per package and the JS
bytes that come from the Vue stack and the React stack.

  --skip-build  Report on the existing dist folders and the stats that the last
                \`yarn bundle-report\` build recorded
  --json        Print the report as JSON instead of tables

Stack bytes are the bytes of the JS output that belong to each module: from
the source maps of a hidden-sourcemap build for Vite, which minifies after
modules are rendered, and from webpack's module sizes for the unminified
runner. Stack gzip is each stack's code compressed together, so it estimates
what that code costs on its own. "Unattributed" is JS output that no module
accounts for: code with no source mapping (such as JSON modules), the bundler
runtime and module wrappers, and chunks built outside the stats plugins, such
as the Vite legacy polyfills chunk.`

const ROOT = path.resolve(__dirname, '..')
const STATS_DIR = path.join(ROOT, 'node_modules', '.cache', 'bundle-report')

const TARGETS = [
  { workspace: '@packages/app', script: 'build', dist: 'packages/app/dist' },
  { workspace: '@packages/launchpad', script: 'build', dist: 'packages/launchpad/dist' },
  // build-prod is what the binary ships
  { workspace: '@packages/runner', script: 'build-prod', dist: 'packages/runner/dist' },
]

const STACKS = {
  vue: ['vue', '@vue/*', 'pinia', 'vue-router', '@urql/vue', '@headlessui/vue', 'floating-vue', 'vue-toastification', '@vueuse/*'],
  react: ['react', 'react-dom', 'mobx'],
}

type Stack = keyof typeof STACKS | 'other'

interface Bytes { raw: number, gzip: number }

interface PackageReport {
  dist: string
  js: Bytes
  css: Bytes
  stacks: Record<Stack, Bytes>
  unattributedJs: number
  stackPackages: Record<string, { stack: Stack, raw: number }>
}

const gzipSize = (content: Buffer | string) => zlib.gzipSync(content, { level: 9 }).length

const packageName = (id: string): string | undefined => {
  const normalized = id.replace(/\\/g, '/').replace(/^\0/, '').split('?')[0]
  const index = normalized.lastIndexOf('node_modules/')

  if (index === -1) return undefined

  const [scope, name] = normalized.slice(index + 'node_modules/'.length).split('/')

  return scope.startsWith('@') ? `${scope}/${name}` : scope
}

const matches = (pkg: string, pattern: string) => {
  return pattern.endsWith('/*') ? pkg.startsWith(pattern.slice(0, -1)) : pkg === pattern
}

const stackFor = (pkg: string | undefined): Stack => {
  if (pkg && STACKS.vue.some((pattern) => matches(pkg, pattern))) return 'vue'

  if (pkg && STACKS.react.some((pattern) => matches(pkg, pattern))) return 'react'

  return 'other'
}

const listFiles = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => {
    const full = path.join(dir, entry.name)

    return entry.isDirectory() ? listFiles(full) : [full]
  }))

  return nested.flat().sort()
}

const readStats = async (): Promise<BundleStats[]> => {
  const files: string[] = await fs.readdir(STATS_DIR).catch(() => [])

  return Promise.all(files.filter((file) => file.endsWith('.json')).sort().map(async (file) => {
    // Safe because this directory only holds files the web-config bundle stats plugins write
    return JSON.parse(await fs.readFile(path.join(STATS_DIR, file), 'utf8')) as BundleStats
  }))
}

const reportPackage = async (dist: string, allStats: BundleStats[]): Promise<PackageReport> => {
  const distDir = path.join(ROOT, dist)
  const files = await listFiles(distDir).catch(() => {
    throw new Error(`${dist} does not exist. Run \`yarn bundle-report\` without --skip-build first.`)
  })

  const js: Bytes = { raw: 0, gzip: 0 }
  const css: Bytes = { raw: 0, gzip: 0 }
  const jsFiles = new Set<string>()

  for (const file of files) {
    const ext = path.extname(file)

    if (ext !== '.js' && ext !== '.css') continue

    const content = await fs.readFile(file)
    const totals = ext === '.js' ? js : css

    totals.raw += content.length
    totals.gzip += gzipSize(content)

    if (ext === '.js') jsFiles.add(path.relative(distDir, file).split(path.sep).join('/'))
  }

  const stats = allStats.filter((s) => path.resolve(s.outDir) === distDir)

  if (!stats.length) {
    throw new Error(`No bundle stats recorded for ${dist}. Run \`yarn bundle-report\` without --skip-build first.`)
  }

  const modulesByStack: Record<Stack, BundleStatsModule[]> = { vue: [], react: [], other: [] }
  const stackPackages: PackageReport['stackPackages'] = {}
  let attributed = 0

  for (const { files: statFiles } of stats) {
    for (const [file, modules] of Object.entries(statFiles)) {
      if (!jsFiles.has(file)) {
        throw new Error(`Bundle stats for ${dist} list ${file}, which is not in the build output. Rebuild with \`yarn bundle-report\`.`)
      }

      for (const module of modules) {
        const pkg = packageName(module.id)
        const stack = stackFor(pkg)

        attributed += module.bytes
        modulesByStack[stack].push(module)

        if (pkg && stack !== 'other') {
          stackPackages[pkg] ??= { stack, raw: 0 }
          stackPackages[pkg].raw += module.bytes
        }
      }
    }
  }

  const summarize = (modules: BundleStatsModule[]): Bytes => {
    const sorted = [...modules].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

    return {
      raw: sorted.reduce((total, m) => total + m.bytes, 0),
      gzip: sorted.length ? gzipSize(sorted.map((m) => m.code).join('\n')) : 0,
    }
  }

  const stacks = { vue: summarize(modulesByStack.vue), react: summarize(modulesByStack.react), other: summarize(modulesByStack.other) }

  return { dist, js, css, stacks, unattributedJs: js.raw - attributed, stackPackages }
}

const kib = (bytes: number) => `${(bytes / 1024).toFixed(1)} KiB`

const table = (header: string[], rows: (string | number)[][]) => {
  const cells = [header, ...rows].map((row) => row.map((cell) => (typeof cell === 'number' ? `${cell} (${kib(cell)})` : cell)))
  const widths = header.map((_, i) => Math.max(...cells.map((row) => row[i].length)))

  return cells.map((row) => {
    return row.map((cell, i) => (i === 0 ? cell.padEnd(widths[i]) : cell.padStart(widths[i]))).join('  ')
  }).join('\n')
}

type Picker = (r: PackageReport) => number

const sum = (reports: PackageReport[], pick: Picker) => reports.reduce((total, r) => total + pick(r), 0)

const printTables = (reports: PackageReport[], commit: string) => {
  const totalRow = (pickers: Picker[]) => ['total', ...pickers.map((pick) => sum(reports, pick))]

  const sizePickers: Picker[] = [(r) => r.js.raw, (r) => r.js.gzip, (r) => r.css.raw, (r) => r.css.gzip]
  const stackPickers: Picker[] = [
    (r) => r.stacks.vue.raw, (r) => r.stacks.vue.gzip,
    (r) => r.stacks.react.raw, (r) => r.stacks.react.gzip,
    (r) => r.stacks.other.raw, (r) => r.unattributedJs,
  ]

  console.log(`Bundle report for ${commit}\n`)
  console.log(table(
    ['package', 'JS raw', 'JS gzip', 'CSS raw', 'CSS gzip'],
    [...reports.map((r) => [r.dist, ...sizePickers.map((pick) => pick(r))]), totalRow(sizePickers)],
  ))

  console.log('\nJS bytes by stack\n')
  console.log(table(
    ['package', 'Vue raw', 'Vue gzip', 'React raw', 'React gzip', 'other raw', 'unattributed'],
    [...reports.map((r) => [r.dist, ...stackPickers.map((pick) => pick(r))]), totalRow(stackPickers)],
  ))

  console.log('\nVue and React stack packages\n')
  console.log(table(
    ['package', 'stack', 'dependency', 'raw'],
    reports.flatMap((r) => {
      return Object.entries(r.stackPackages)
      .sort(([a, x], [b, y]) => x.stack.localeCompare(y.stack) || y.raw - x.raw || a.localeCompare(b))
      .map(([pkg, { stack, raw }]) => [r.dist, stack, pkg, raw])
    }),
  ))
}

const build = () => {
  for (const { workspace, script } of TARGETS) {
    console.error(`\nBuilding ${workspace} (${script}) with bundle stats\n`)

    // Build output goes to stderr so stdout holds only the report
    const result = spawnSync('yarn', ['workspace', workspace, script], {
      cwd: ROOT,
      stdio: ['ignore', 2, 2],
      env: { ...process.env, [BUNDLE_STATS_DIR_ENV]: STATS_DIR },
    })

    if (result.status !== 0) {
      throw new Error(`${workspace} ${script} failed with exit code ${result.status}`)
    }
  }
}

const main = async () => {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE)

    return
  }

  if (!args.includes('--skip-build')) {
    await fs.rm(STATS_DIR, { recursive: true, force: true })
    build()
  }

  const allStats = await readStats()
  const reports = await Promise.all(TARGETS.map(({ dist }) => reportPackage(dist, allStats)))
  const git = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' })
  const commit = git.status === 0 ? git.stdout.trim() : 'unknown commit'

  if (args.includes('--json')) {
    console.log(JSON.stringify({ commit, packages: reports }, null, 2))

    return
  }

  printTables(reports, commit)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
