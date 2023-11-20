import { ChildProcess,
  ChildProcessWithoutNullStreams,
  exec, ExecOptions,
  fork, ForkOptions,
  spawn, SpawnOptions,
} from 'child_process'
import through2 from 'through2'
import pDefer from 'p-defer'
import util from 'util'

import { prefixLog, prefixStream } from './prefixStream'
import { addChildProcess } from '../tasks/gulpRegistry'
import stripAnsi from 'strip-ansi'

export type AllSpawnableApps =
  | `cmd-${string}`
  | `vite-${string}`
  | `vite:build-${string}`
  | `serve:${string}`
  | 'gql-codegen'
  | `cy:${string}`

interface TapThroughConfig {
  tapOut?: through2.TransformFunction
  tapErr?: through2.TransformFunction
}

interface SpawnedOptions extends TapThroughConfig, SpawnOptions {
  waitForExit?: boolean
  waitForData?: boolean
}

interface SpawnUntilMatchConfig {
  command: string
  match: string | RegExp
  options?: SpawnOptions
}

export async function spawnUntilMatch (
  prefix: AllSpawnableApps,
  config: SpawnUntilMatchConfig,
) {
  const dfd = pDefer()
  let ready = false

  spawned(prefix, config.command, {
    ...config.options,
    tapOut (chunk, enc, cb) {
      if (!ready && stripAnsi(String(chunk)).match(config.match)) {
        ready = true
        setTimeout(() => dfd.resolve(), 20) // flush the rest of the chunks
      }

      cb(null, chunk)
    },
  })

  return dfd.promise
}

interface ForkUntilMatchConfig {
  modulePath: string
  args: string[]
  match: string | RegExp
  options?: SpawnOptions
}

export async function forkUntilMatch (
  prefix: AllSpawnableApps,
  config: ForkUntilMatchConfig,
) {
  const dfd = pDefer<ChildProcess>()
  let ready = false

  const cp = await forked(prefix, config.modulePath, config.args, {
    ...config.options,
    tapOut (chunk, enc, cb) {
      if (!ready && String(chunk).match(config.match)) {
        ready = true
        setTimeout(() => dfd.resolve(cp), 20) // flush the rest of the chunks
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
) {
  const { waitForExit, waitForData, tapErr, tapOut, ...spawnOpts } = opts

  const [executable, ...rest] = command.split(' ')

  const cp = universalSpawn(executable, rest, {
    stdio: 'pipe',
    ...spawnOpts,
    env: {
      FORCE_COLOR: '1',
      NODE_ENV: 'development',
      ...process.env,
      ...spawnOpts.env,
    },
  })

  addChildProcess(cp)

  return streamHandler(cp, {
    tapErr,
    tapOut,
    command,
    prefix,
    waitForExit,
    waitForData,
  })
}

interface ForkedOptions extends TapThroughConfig, ForkOptions {
  waitForExit?: boolean
  waitForData?: boolean
}

export async function forked (
  prefix: AllSpawnableApps,
  modulePath: string,
  args: string[],
  opts: ForkedOptions = {},
) {
  const { waitForExit, waitForData, tapErr, tapOut, ...spawnOpts } = opts

  const cp = fork(modulePath, args, {
    stdio: 'pipe',
    ...spawnOpts,
    env: {
      FORCE_COLOR: '1',
      NODE_ENV: 'development',
      ...process.env,
      ...spawnOpts.env,
    },
  })

  addChildProcess(cp)

  return streamHandler(cp, {
    tapOut,
    tapErr,
    command: modulePath,
    prefix,
    waitForExit,
    waitForData,
  })
}

function writeError (e: Error) {
  return JSON.stringify({ name: e.name, message: e.message, stack: e.stack })
}

const execAsyncLocal = util.promisify(exec)

export interface ExecAsyncOptions extends ExecOptions {
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

export interface StreamHandlerConfig extends TapThroughConfig {
  prefix: string
  waitForExit?: boolean
  waitForData?: boolean
  command: string
}

function streamHandler (cp: ChildProcess, config: StreamHandlerConfig) {
  const dfd = pDefer<ChildProcess>()
  const { command, tapErr = null, tapOut = null, prefix, waitForExit, waitForData = true } = config
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

  const log = prefixLog(`${prefix}:${cp.pid}`)

  if (waitForExit) {
    cp.on('exit', (code, signal) => {
      log.log(`Exit code: ${code} => ${signal}`)
      prefixedStdout?.unpipe(process.stdout)
      prefixedStderr?.unpipe(process.stderr)
      dfd.resolve(cp)
    })

    cp.once('error', (e) => {
      log.error(`error executing ${command} ${writeError(e)}`)
      prefixedStdout?.unpipe(process.stdout)
      prefixedStderr?.unpipe(process.stderr)
      dfd.reject(e)
    })
  } else {
    cp.once('exit', (code, signal) => {
      log.log(`Exit code: ${code} => ${signal}`)
    })

    cp.once('error', (e) => {
      log.error(`error executing ${command} ${writeError(e)}`)
      dfd.reject(e)
    })

    if (waitForData) {
      cp.stdout?.once('data', () => {
        dfd.resolve(cp)
      })
    } else {
      dfd.resolve(cp)
    }
  }

  return dfd.promise
}

const isWin = process.platform === 'win32'

/**
 * Pretreat commands to make them compatible with windows
 * @param command
 * @returns
 */
export function universalSpawn (
  command: string,
  args: string[],
  opts?: any,
): ChildProcessWithoutNullStreams {
  const uCommand = isWin ? `${(command).replace(/\//g, '\\')}.cmd` : command

  return spawn(uCommand, args, opts)
}
