/* eslint-disable no-console */
import { exec, ExecOptions, spawn, SpawnOptions } from 'child_process'
import through2 from 'through2'
import util from 'util'

// import psTree from 'ps-tree'
// import psNode from 'ps-node'
// import util from 'util'

import { prefixStream } from './prefixStream'

const spawningApps = new Set()
// const killAsync = util.promisify(psNode.kill)
// const psTreeAsync = util.promisify(psTree)
// const runningApps = new Map<
//   AllSpawnableApps,
//   [ChildProcess, ArgsFor<typeof spawned>, Function]
// >()

export async function allReady () {
  while (spawningApps.size > 0) {
    await new Promise((ready) => setTimeout(ready, 100))
  }

  return true
}

export type AllSpawnableApps =
  | `vite-${string}`
  | `vite:build-${string}`
  | 'gql-codegen'

interface SpawnedOptions extends SpawnOptions {
  waitForExit?: boolean
}

export async function spawned (
  prefix: AllSpawnableApps,
  command: string,
  opts: SpawnedOptions = {},
  tapThrough: {
    tapOut?: through2.TransformFunction
    tapErr?: through2.TransformFunction
  } = {},
) {
  const { waitForExit, ...spawnOpts } = opts

  spawningApps.add(prefix)
  const [executable, ...rest] = command.split(' ')
  const cp = spawn(executable, rest, {
    stdio: 'pipe',
    env: {
      FORCE_COLOR: '1',
      NODE_ENV: 'development',
      ...process.env,
    },
    ...spawnOpts,
  })
  const tapOut = tapThrough.tapOut || null
  const tapErr = tapThrough.tapErr || null
  const prefixedStdout = cp.stdout?.pipe(
    through2(function (chunk, enc, cb) {
      if (tapOut) {
        tapOut.call(this, chunk, enc, cb)
      } else {
        cb(null, chunk)
      }
    }),
  )
  .pipe(prefixStream(`${prefix}:${cp.pid}`))

  const prefixedStderr = cp.stderr?.pipe(
    through2(function (chunk, enc, cb) {
      if (tapErr) {
        tapErr.call(this, chunk, enc, cb)
      } else {
        cb(null, chunk)
      }
    }),
  )
  .pipe(prefixStream(`${prefix}:${cp.pid}`))

  prefixedStdout?.pipe(process.stdout)
  prefixedStderr?.pipe(process.stderr)

  // const cleanup = () => {
  //   prefixedStdout?.unpipe(process.stdout)
  //   prefixedStderr?.unpipe(process.stderr)
  // }

  // runningApps.set(prefix, [cp, [prefix, command, opts], cleanup])

  return new Promise((resolve, reject) => {
    if (waitForExit) {
      cp.once('exit', () => {
        resolve(cp)
      })

      cp.once('error', reject)
    } else {
      cp.stdout?.once('data', () => {
        spawningApps.delete(prefix)
        resolve(cp)
      })
    }
  })
}

const execAsyncLocal = util.promisify(exec)

interface ExecAsyncOptions extends ExecOptions {
  encoding?: string | null
  silent?: boolean
}

export const execAsync = async (
  command: string,
  options: ExecAsyncOptions = {},
) => {
  const { silent } = options

  if (!silent) {
    console.log(command)
  }

  const result = await execAsyncLocal(command, options)

  if (!silent && typeof result.stdout === 'string' && result.stdout.length) {
    console.log(result.stdout)
  }

  if (!silent && typeof result.stderr === 'string' && result.stderr.length) {
    console.error(result.stderr)
  }

  return result
}
