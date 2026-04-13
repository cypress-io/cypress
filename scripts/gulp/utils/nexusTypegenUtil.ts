import { spawn, execSync } from 'child_process'
import chalk from 'chalk'
import pDefer from 'p-defer'
import chokidar from 'chokidar'
import path from 'path'
import fs from 'fs-extra'

import { generateFrontendSchema } from '../tasks/gulpGraphql'
import { monorepoPaths } from '../monorepoPaths'

interface NexusTypegenCfg {
  cwd: string
  /**
   * Path to the file we need to execute to generate the schema
   */
  filePath: string
  outputPath?: string
}

function prefixTypegen (s: string) {
  return `${chalk.cyan('nexusTypegen')}: ${s}`
}

async function windowsTouch (filename: string, time: Date) {
  // `fs.utimesSync` is used here to prevent existing file contents from being overwritten.
  // It also updates the last modification timestamp of the file, which is consistent with what POSIX touch does.
  try {
    fs.utimesSync(filename, time, time)
  } catch (e) {
    fs.closeSync(fs.openSync(filename, 'w'))
  }
}

export async function nexusTypegen (cfg: NexusTypegenCfg) {
  const dfd = pDefer()

  if (cfg.outputPath) {
    await fs.ensureDir(path.join(monorepoPaths.pkgDataContext, 'src/gen'))

    const pkgDataContext = path.join(monorepoPaths.pkgDataContext, 'src/gen/cloud-source-types.gen.ts')

    // on windows there is no `touch` equivalent command
    if (process.platform === 'win32') {
      const time = new Date()

      await windowsTouch(pkgDataContext, time)
      await windowsTouch(cfg.outputPath, time)
    } else {
      execSync(`touch ${pkgDataContext}`)
      execSync(`touch ${cfg.outputPath}`)
    }
  }

  const nodeCmd = `node${process.platform === 'win32' ? '.cmd' : ''}`
  const out = spawn(nodeCmd, ['-r', '@packages/ts/register', cfg.filePath], {
    cwd: cfg.cwd,
    env: {
      ...process.env,
      CYPRESS_INTERNAL_NEXUS_CODEGEN: 'true',
      TS_NODE_CACHE: 'false',
    },
  })

  out.stderr.on('data', (data) => {
    process.stdout.write(prefixTypegen(chalk.red(String(data))))
    dfd.resolve({})
  })

  out.stdout.on('data', (data) => {
    const outString = String(data)
    .split('\n')
    .map((s) => prefixTypegen(chalk.magentaBright(s)))
    .join('\n')

    process.stdout.write('\n')
    process.stdout.write(outString)
    process.stdout.write('\n')
    dfd.resolve({})
  })

  out.on('error', dfd.reject)

  return dfd.promise.then(() => {
    return generateFrontendSchema()
  })
}

function debounce<T extends (...args: any[]) => any> (fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)

    timer = setTimeout(() => fn(...args), ms)
  }
}

let debouncedFns: Record<string, Function> = {}

const nexusTypegenDebounced = (cfg: NexusTypegenCfg) => {
  debouncedFns[cfg.filePath] =
    debouncedFns[cfg.filePath] ?? debounce(nexusTypegen, 500)

  debouncedFns[cfg.filePath](cfg)
}

interface NexusTypegenWatchCfg extends NexusTypegenCfg {
  watchPaths: string[]
}

export async function watchNexusTypegen (cfg: NexusTypegenWatchCfg) {
  const dfd = pDefer()

  const watcher = chokidar.watch(cfg.watchPaths, {
    cwd: cfg.cwd,
    ignored: /\.gen\.ts/,
    ignoreInitial: true,
  })

  watcher.on('all', (evt, path) => {
    console.log(prefixTypegen(`${evt} ${path}`))
    nexusTypegenDebounced(cfg)
  })

  watcher.on('ready', () => {
    console.log(prefixTypegen(`Codegen Watcher Ready for ${cfg.filePath}`))
    nexusTypegen(cfg).then(dfd.resolve, dfd.reject)
  })

  return dfd.promise
}
