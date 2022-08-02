import chalk from 'chalk'
import pDefer from 'p-defer'
import { monorepoPaths } from '../monorepoPaths'
import { universalSpawn } from '../utils/childProcessUtils'
import { addChildProcess } from './gulpRegistry'
import semver from 'semver'

type Env = typeof process.env

export function webpackReporter () {
  return runWebpack({
    cwd: monorepoPaths.pkgReporter,
    prefix: 'webpack:reporter',
    args: ['-w'],
  })
}

export function webpackRunnerCT () {
  return runWebpack({
    cwd: monorepoPaths.pkgRunnerCt,
    prefix: 'webpack:runner:ct',
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

// https://github.com/cypress-io/cypress/issues/18914
// Node 17+ ships with OpenSSL 3 by default, so we may need the option
// --openssl-legacy-provider so that webpack@4 can use the legacy MD4 hash
// function. This option doesn't exist on Node <17 or when it is built
// against OpenSSL 1, so we have to detect Node's major version and check
// which version of OpenSSL it was built against before spawning the process.
//
// Can be removed once the webpack version is upgraded to >= 5.61,
// which no longer relies on Node's builtin crypto.hash function.
function useLegacyOpenSSLProvider (env: Env) {
  if (process.versions && semver.satisfies(process.versions.node, '>=17.0.0') && semver.satisfies(process.versions.openssl, '>=3', { includePrerelease: true })) {
    return { NODE_OPTIONS: `${env.NODE_OPTIONS ?? ''} --openssl-legacy-provider` }
  }

  return {}
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
        ...useLegacyOpenSSLProvider(env),
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
