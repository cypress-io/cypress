import chalk from 'chalk'
import { spawn } from 'child_process'
import pDefer from 'p-defer'
import { monorepoPaths } from '../monorepoPaths'
import { addChildProcess } from './gulpRegistry'

export function webpackRunner () {
  return runWebpack({
    cwd: monorepoPaths.pkgRunnerCt,
    prefix: 'webpack:runner',
    args: ['-w'],
  })
}

type RunWebpackCfg = {
  cwd: string
  prefix: string
  args?: string[]
  env?: object
  devServer?: boolean
}

export async function runWebpack (cfg: RunWebpackCfg) {
  const { cwd, args = [], env = process.env, devServer = false, prefix } = cfg
  console.log(cwd);
  const dfd = pDefer()
  const spawned = spawn(
  `bash.exe ${devServer
      ? './node_modules/.bin/webpack-dev-server'
      : './node_modules/.bin/webpack'}`,
    args,
    {
      cwd,
      shell:true,
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
