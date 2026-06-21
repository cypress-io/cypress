import _ from 'lodash'
import os from 'os'
import cp from 'child_process'
import path from 'path'
import Debug from 'debug'
import util from '../util'
import state from '../tasks/state'
import xvfb from './xvfb'
import { needsSandbox } from '../tasks/verify'
import { throwFormErrorText, getErrorSync, errors } from '../errors'
import readline from 'readline'
import process, { stdin, stdout, stderr } from 'process'
import { relativeToRepoRoot } from '../relative-to-repo-root'
import { filter, DEBUG_PREFIX } from '@packages/stderr-filtering'
import { PassThrough } from 'stream'

const debug = Debug('cypress:cli')
const debugElectron = Debug('cypress:electron')
const debugStderr = Debug('cypress:internal-stderr')

// Must match CYPRESS_OPEN_READY_MESSAGE in packages/server/lib/modes/interactive.ts
const CYPRESS_OPEN_READY_MESSAGE = 'Cypress is ready'

function isPlatform (platform: string): boolean {
  return os.platform() === platform
}

function needsStderrPiped (needsXvfb: boolean): boolean {
  return _.some([
    isPlatform('darwin'),

    (needsXvfb && isPlatform('linux')),

    util.isPossibleLinuxWithIncorrectDisplay(),
  ])
}

function needsEverythingPipedDirectly (): boolean {
  return isPlatform('win32')
}

function getStdioStrategy (needsXvfb: boolean): string | string[] {
  if (needsEverythingPipedDirectly()) {
    return 'pipe'
  }

  // https://github.com/cypress-io/cypress/issues/921
  // https://github.com/cypress-io/cypress/issues/1143
  // https://github.com/cypress-io/cypress/issues/1745
  if (needsStderrPiped(needsXvfb)) {
    // returning pipe here so we can massage stderr
    // and remove garbage from Xlib and libuv
    // due to starting the Xvfb process on linux
    return ['inherit', 'inherit', 'pipe']
  }

  return 'inherit'
}

function createSpawnFunction (
  executable: string,
  args: string[],
  options: any,
) {
  return (overrides: any = {}): any => {
    return new Promise(async (resolve: any, reject: any) => {
      _.defaults(overrides, {
        onStderrData: false,
      })

      const { onStderrData } = overrides
      const envOverrides = util.getEnvOverrides(options)
      const electronArgs: string[] = []
      const node11WindowsFix = isPlatform('win32')

      let startScriptPath: string | undefined

      if (options.dev) {
        executable = 'node'
        // if we're in dev then reset
        // the launch cmd to be 'npm run dev'
        // This path is correct in the build output, but not the source code. This file gets bundled into
        // `dist/spawn-<hash>.js`, which makes this resolution appear incorrect at first glance.
        startScriptPath = relativeToRepoRoot('scripts/start.js')
        if (!startScriptPath) {
          throw new Error(`Cypress start script (scripts/start.js) not found in parent directory of ${__dirname}`)
        }
      }

      if (!options.dev && needsSandbox()) {
        electronArgs.push('--no-sandbox')
      }

      // strip dev out of child process options
      /**
         * @type {import('child_process').ForkOptions}
         */
      let stdioOptions: any = _.pick(options, 'env', 'detached', 'stdio')

      // figure out if we're going to be force enabling or disabling colors.
      // also figure out whether we should force stdout and stderr into thinking
      // it is a tty as opposed to a pipe.
      stdioOptions.env = _.extend({}, stdioOptions.env, envOverrides)

      if (node11WindowsFix) {
        stdioOptions = _.extend({}, stdioOptions, { windowsHide: false })
      }

      if (util.isPossibleLinuxWithIncorrectDisplay()) {
        // make sure we use the latest DISPLAY variable if any
        debug('passing DISPLAY', process.env.DISPLAY)
        stdioOptions.env.DISPLAY = process.env.DISPLAY
      }

      if (stdioOptions.detached) {
        // Ask interactive mode to print a ready sentinel on stdout; pipe stdio during
        // startup so errors are visible and we can detect it. Streams are destroyed
        // once it arrives so they don't keep the parent event loop alive.
        args.push('--emit-when-ready')
        stdioOptions.stdio = ['ignore', 'pipe', 'pipe']
      }

      if (stdioOptions.env.ELECTRON_RUN_AS_NODE) {
        // Since we are running electron as node, we need to add an entry point file.
        startScriptPath = path.join(state.getBinaryPkgPath(path.dirname(executable)), '..', 'index.js')
      } else {
        // Start arguments with "--" so Electron knows these are OUR
        // arguments and does not try to sanitize them. Otherwise on Windows
        // an url in one of the arguments crashes it :(
        // https://github.com/cypress-io/cypress/issues/5466
        args = [...electronArgs, '--', ...args]
      }

      if (startScriptPath) {
        args.unshift(startScriptPath)
      }

      if (process.env.CYPRESS_INTERNAL_DEV_DEBUG) {
        args.unshift(process.env.CYPRESS_INTERNAL_DEV_DEBUG)
      }

      debug('spawn args %o %o', args, _.omit(stdioOptions, 'env'))
      debug('spawning Cypress with executable: %s', executable)

      const platform = await util.getPlatformInfo().catch((e) => reject(e))

      if (!platform) {
        return
      }

      function resolveOn (event: any): any {
        return function (code: any, signal: NodeJS.Signals): void {
          debug('child event fired %o', { event, code, signal })

          if (signal) {
            if (signal === 'SIGINT') {
              resolve(0)
            } else {
              resolve(128 + os.constants.signals[signal])
            }

            return
          }

          resolve(code ?? 1)
        }
      }

      const child = cp.spawn(executable, args, stdioOptions)

      child.on('close', resolveOn('close'))

      child.on('exit', resolveOn('exit'))

      child.on('error', reject)

      if (isPlatform('win32')) {
        const rl = readline.createInterface({
          input: stdin,
          output: stdout,
        })

        // on windows, SIGINT does not propagate to the child process when ctrl+c is pressed
        // this makes sure all nested processes are closed(ex: firefox inside the server)
        rl.on('SIGINT', async function () {
          const kill = (await import('tree-kill')).default

          kill(child.pid as number, 'SIGINT')
        })
      } else {
        // Adding listeners here prevents immediate process.exit() for these signals.
        // Exiting when the child process exits instead will allow the child process
        // to log during the exit process.

        // Unlike in windows, we do not need to propagate these signals to the child process
        // tree.
        for (const signal of ['SIGINT', 'SIGTERM']) {
          debug('adding message for signal listener for %s', signal)
          process.once(signal, async function () {
            console.log(`\n\n${signal} received; Attempting to exit gracefully. Force exit with ^C again if needed.\n\n`)
            if (process.stdin.isTTY) {
              process.stdin.setRawMode(false)
            }
          })
        }
      }

      if (stdioOptions.detached) {
        child.stdout!.on('data', (data: Buffer) => {
          const str = data.toString()
          const readyMessageIndex = str.indexOf(CYPRESS_OPEN_READY_MESSAGE)
          const isReady = readyMessageIndex !== -1

          if (isReady) {
            const outputBeforeReady = str.slice(0, readyMessageIndex)

            if (outputBeforeReady) stdout.write(outputBeforeReady)

            child.stdout!.destroy()
            child.stderr!.destroy()
            child.unref()
            resolve(0)

            return
          }

          stdout.write(data)
        })

        child.stderr!.pipe(stderr, { end: false })

        return
      }

      // if stdio options is set to 'pipe', then
      //   we should set up pipes:
      //  process STDIN (read stream) => child STDIN (writeable)
      //  child STDOUT => process STDOUT
      //  child STDERR => process STDERR with additional filtering
      if (child.stdin) {
        debug('piping process STDIN into child STDIN')
        stdin.pipe(child.stdin)
      }

      if (child.stdout) {
        debug('piping child STDOUT to process STDOUT')
        child.stdout.pipe(stdout)
      }

      // if this is defined then we are manually piping for linux
      // to filter out the garbage
      if (child.stderr) {
        debug('piping child STDERR to process STDERR')

        const sourceStream = new PassThrough()

        child.on('close', () => {
          sourceStream.end()
        })

        child.stderr.on('data', (data: any) => {
          const str = data.toString()

          if (onStderrData && onStderrData(str)) {
            return
          }

          if (sourceStream.writable) {
            sourceStream.write(data)
          }
        })

        if (
          (process.env.ELECTRON_ENABLE_LOGGING ?? '') === '1' ||
          debugElectron.enabled ||
          (process.env.CYPRESS_INTERNAL_ENV ?? '') === 'development'
        ) {
          sourceStream.pipe(stderr, { end: false })
        } else {
          sourceStream.pipe(filter(stderr, debugStderr, DEBUG_PREFIX))
        }
      }

      // https://github.com/cypress-io/cypress/issues/1841
      // https://github.com/cypress-io/cypress/issues/5241
      // In some versions of node, it will throw on windows
      // when you close the parent process after piping
      // into the child process. unpiping does not seem
      // to have any effect. so we're just catching the
      // error here and not doing anything.
      stdin.on('error', (err: any) => {
        debug('error on stdin', err)
        if (['EPIPE', 'ENOTCONN'].includes(err.code)) {
          return
        }

        reject(err)
      })
    })
  }
}

async function spawnInXvfb (spawn: ReturnType<typeof createSpawnFunction>): Promise<number> {
  try {
    await xvfb.start()

    debug('xvfb started')
    const code = await userFriendlySpawn(spawn)

    return code
  } finally {
    await xvfb.stop()
  }
}

async function userFriendlySpawn (spawn: ReturnType<typeof createSpawnFunction>, linuxWithDisplayEnv?: any): Promise<any> {
  debug('spawning, should retry on display problem?', Boolean(linuxWithDisplayEnv))

  let brokenGtkDisplay: boolean = false

  const overrides: any = {}

  if (linuxWithDisplayEnv) {
    _.extend(overrides, {
      electronLogging: true,
      onStderrData (str: string): any {
        // if we receive a broken pipe anywhere
        // then we know that's why cypress exited early
        if (util.isBrokenGtkDisplay(str)) {
          brokenGtkDisplay = true
        }
      },
    })
  }

  try {
    const code: number = await spawn(overrides)

    debug('tried spawning without xvfb, code', code, brokenGtkDisplay)
    if (code !== 0 && brokenGtkDisplay) {
      util.logBrokenGtkDisplayWarning()

      return spawnInXvfb(spawn)
    }

    return code
  } catch (error: any) {
    debug('error in userFriendlySpawn', error)
    // we can format and handle an error message from the code above
    // prevent wrapping error again by using "known: undefined" filter
    if ((error as any).known === undefined) {
      const raiseErrorFn = throwFormErrorText(errors.unexpected)

      await raiseErrorFn(error.message)
    }

    throw error
  }
}

interface StartOptions {
  dev?: boolean
  env?: Record<string, string | undefined>
  detached?: boolean
  stdio?: string | string[]
}

export async function start (args: string | string[], options: StartOptions = {}): Promise<any> {
  let executable = util.getEnv('CYPRESS_RUN_BINARY') ?
    path.resolve(util.getEnv('CYPRESS_RUN_BINARY') as string) :
    state.getPathToExecutable(state.getBinaryDir())

  // Always push cwd into the args
  // which additionally acts as a signal to the
  // binary that it was invoked through the NPM module
  const baseArgs = args ? (typeof args === 'string' ? [args] : args) : []
  const decoratedArgs = baseArgs.concat([
    '--cwd', process.cwd(),
    '--userNodePath', process.execPath,
    '--userNodeVersion', process.versions.node,
  ])

  const needsXvfb = xvfb.isNeeded()

  debug('needs to start own Xvfb?', needsXvfb)

  const stdio = options.stdio ?? getStdioStrategy(needsXvfb)
  const dev = options.dev ?? false
  const detached = options.detached ?? false
  const env = options.env ?? process.env

  const spawn = createSpawnFunction(executable, decoratedArgs, { stdio, dev, detached, env })

  if (needsXvfb) {
    debug('starting xvfb')

    return spawnInXvfb(spawn)
  }

  // if we are on linux and there's already a DISPLAY
  // set, then we may need to rerun cypress after
  // spawning our own Xvfb server
  const linuxWithDisplayEnv = util.isPossibleLinuxWithIncorrectDisplay()

  debug('linuxWithDisplayEnv', linuxWithDisplayEnv)

  return userFriendlySpawn(spawn, linuxWithDisplayEnv)
}
