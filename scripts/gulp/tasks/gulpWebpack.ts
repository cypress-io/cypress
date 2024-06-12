import chalk from 'chalk'
import pDefer from 'p-defer'
import { monorepoPaths } from '../monorepoPaths'
import { universalSpawn } from '../utils/childProcessUtils'
import { addChildProcess } from './gulpRegistry'

type Env = typeof process.env

export function webpackReporter () {
  return runWebpack({
    cwd: monorepoPaths.pkgReporter,
    prefix: 'webpack:reporter',
    args: ['-w'],
    enableLiveReload: true,
  })
}

export function webpackRunner () {
  return runWebpack({
    cwd: monorepoPaths.pkgRunner,
    prefix: 'webpack:runner',
    args: ['-w'],
    enableLiveReload: true,
  })
}

type RunWebpackCfg = {
  cwd: string
  prefix: string
  args?: string[]
  env?: Env
  enableLiveReload?: boolean
}

export async function runWebpack (cfg: RunWebpackCfg) {
  const { cwd, args = [], env = process.env, prefix, enableLiveReload = false } = cfg
  const dfd = pDefer()
  const spawned = universalSpawn('webpack',
    args,
    {
      cwd,
      env: {
        ...(env || process.env),
        FORCE_COLOR: '1',
        ENABLE_LIVE_RELOAD: enableLiveReload ? '1' : undefined,
      },
    })

  addChildProcess(spawned)

  spawned.stdout.on('data', (chunk) => {
    process.stdout.write('\n')
    String(chunk)
    .split('\n')
    .forEach((line) => {
      if (
        line.includes('webpack compiled') ||
          line.includes('WARNING in') ||
          line.includes('ERROR in') ||
          line.includes('Live Reload listening')
      ) {
        dfd.resolve({})
      }

      process.stdout.write(`${chalk.cyan(`${prefix}: `)}${line}\n`)
    })
  })

  spawned.stderr.on('data', (chunk) => {
    process.stderr.write('\n')
    String(chunk)
    .split('\n')
    .forEach((line) => {
      process.stderr.write(`${chalk.red(`${prefix}: `)}${line}\n`)
    })
  })

  return dfd.promise
}
