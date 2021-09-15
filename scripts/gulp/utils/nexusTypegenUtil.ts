/* eslint-disable no-console */
import { spawn, execSync } from 'child_process'
import chalk from 'chalk'
import pDefer from 'p-defer'
import chokidar from 'chokidar'
import _ from 'lodash'

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

export async function nexusTypegen (cfg: NexusTypegenCfg) {
  const dfd = pDefer()

  if (cfg.outputPath) {
    execSync(`touch ${cfg.outputPath}`)
  }

  const out = spawn('node', ['-r', '@packages/ts/register', cfg.filePath], {
    cwd: cfg.cwd,
    env: {
      ...process.env,
      CYPRESS_NEXUS_CODEGEN: 'true',
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

  out.on('error', (e) => {
    console.error(e)
    dfd.reject()
  })

  return dfd.promise
}

let debounced: Record<string, Function> = {}

const nexusTypegenDebounced = (cfg: NexusTypegenCfg) => {
  debounced[cfg.filePath] =
    debounced[cfg.filePath] ?? _.debounce(nexusTypegen, 500)

  debounced[cfg.filePath](cfg)
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
