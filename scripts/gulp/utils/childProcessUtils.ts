import { exec, ExecOptions, spawn, SpawnOptions } from 'child_process'
import through2 from 'through2'
import pDefer from 'p-defer'
import util from 'util'

import { prefixStream } from './prefixStream'

export type AllSpawnableApps =
  | `vite-${string}`
  | `vite:build-${string}`
  | `vite:serve-${string}`
  | 'gql-codegen'

interface SpawnedOptions extends SpawnOptions {
  waitForExit?: boolean
}

export async function spawnUntilMatch (
  prefix: AllSpawnableApps,
  command: string,
  match: string | RegExp,
  opts: SpawnOptions = {},
) {
  const dfd = pDefer()
  let ready = false

  spawned(prefix, command, opts, {
    tapOut (chunk, enc, cb) {
      if (!ready && String(chunk).match(match)) {
        ready = true
        setTimeout(() => dfd.resolve(), 20) // flush the rest of the chunks
      }

      cb(null, chunk)
    },
  })

  return dfd.promise
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

  return new Promise((resolve, reject) => {
    if (waitForExit) {
      cp.once('exit', () => {
        resolve(cp)
      })

      cp.once('error', reject)
    } else {
      cp.stdout?.once('data', () => {
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
