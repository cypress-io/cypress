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
  })
}

export function webpackRunner () {
  return runWebpack({
    cwd: monorepoPaths.pkgRunner,
    prefix: 'webpack:runner',
    args: ['-w'],
  })
}

type RunWebpackCfg = {
  cwd: string
  prefix: string
  args?: string[]
  env?: Env
  devServer?: boolean
}

export async function runWebpack (cfg: RunWebpackCfg) {
  const { cwd, args = [], env = process.env, devServer = false, prefix } = cfg
  const dfd = pDefer()
  const spawned = universalSpawn(
    devServer
      ? 'webpack-dev-server'
      : 'webpack',
    args,
    {
      cwd,
      env: {
        ...(env || process.env),
        FORCE_COLOR: '1',
      },
    },
  )

  addChildProcess(spawned)

  spawned.stdout.on('data', (chunk) => {
    process.stdout.write('\n')
    String(chunk)
    .split('\n')
    .forEach((line) => {
      if (
        line.includes('Compiled successfully') ||
          line.includes('Compiled with warnings') ||
          line.includes('Failed to compile') ||
          line.includes('Built at: ') ||
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
