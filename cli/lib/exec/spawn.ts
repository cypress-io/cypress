import _ from 'lodash'
import os from 'os'
import cp from 'child_process'
import path from 'path'
import Debug from 'debug'
import util from '../util'
import state from '../tasks/state'
import xvfb from './xvfb'
import { openDetachedOutput, closeDetachedOutput, removeDetachedOutput, discardDetachedOutput, nameForApp, signalExitCode, waitForReadyMessage } from './detached'
import type { DetachedOutput } from './detached'
import { needsSandbox } from '../tasks/verify'
import { throwFormErrorText, errors } from '../errors'
import readline from 'readline'
import process, { stdin, stdout, stderr } from 'process'
import { relativeToRepoRoot } from '../relative-to-repo-root'
import { filter, DEBUG_PREFIX } from '@packages/stderr-filtering'
import { PassThrough } from 'stream'

const debug = Debug('cypress:cli')
const debugElectron = Debug('cypress:electron')
const debugStderr = Debug('cypress:internal-stderr')

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

// Where a child's stderr is written: straight through when logging is on, otherwise
// through the filter that drops the noise Xlib and libuv print
function pipeToFilteredStderr (): PassThrough {
  const sourceStream = new PassThrough()

  if (
    (process.env.ELECTRON_ENABLE_LOGGING ?? '') === '1' ||
    debugElectron.enabled ||
    (process.env.CYPRESS_INTERNAL_ENV ?? '') === 'development'
  ) {
    sourceStream.pipe(stderr, { end: false })
  } else {
    sourceStream.pipe(filter(stderr, debugStderr, DEBUG_PREFIX))
  }

  return sourceStream
}

const INTERRUPT_SIGNALS: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']

// The signal reaches the processes the app started too, as Ctrl-C does for an app that is not
// detached. On Windows that takes the process tree; elsewhere the app leads a process group of its own.
function killApp (child: cp.ChildProcess, signal: NodeJS.Signals = 'SIGTERM'): void {
  const pid = child.pid

  if (pid && isPlatform('win32')) {
    const killOnlyApp = (err: unknown) => {
      debug('could not kill the process tree of the app, signalling only the app %o', err)
      child.kill(signal)
    }

    void import('tree-kill').then(({ default: kill }) => {
      kill(pid, signal, (err) => {
        if (err) killOnlyApp(err)
      })
    }).catch(killOnlyApp)

    return
  }

  if (pid) {
    try {
      process.kill(-pid, signal)

      return
    } catch (err) {
      debug('could not signal the process group of the app, signalling only the app %o', err)
    }
  }

  child.kill(signal)
}

function createSpawnFunction (
  executable: string,
  baseArgs: string[],
  options: any,
) {
  // `done` is set once a detached app is running on its own, so its Xvfb is not stopped with the
  // CLI. `signal` is the interrupt that stopped a detached app before it was ready.
  const handoff: { done: boolean, signal?: NodeJS.Signals } = { done: false }

  // The detached app that has been spawned but is not ready yet
  let startingChild: cp.ChildProcess | undefined

  // Until a detached app is ready there is nothing to hand off, so an interrupt stops the launch
  // instead of leaving the app, or a Xvfb started for it in a session of its own, running unseen.
  // Before the app is spawned that means stopping the Xvfb, which also ends a wait for one that is
  // slow to start. A second interrupt does not wait for an app that ignored the first.
  const interruptHandlers = INTERRUPT_SIGNALS.map((signal) => {
    const handler = () => {
      debug('%s received before the app was ready, stopping it', signal)

      if (startingChild) {
        killApp(startingChild, handoff.signal ? 'SIGKILL' : signal)
      } else {
        void xvfb.stop()
      }

      handoff.signal = handoff.signal ?? signal
    }

    return { signal, handler }
  })

  const armInterrupts = () => {
    interruptHandlers.forEach(({ signal, handler }) => process.on(signal, handler))
  }

  // Safe to call again once disarmed: removing a handler that is not there does nothing
  const disarmInterrupts = () => {
    interruptHandlers.forEach(({ signal, handler }) => process.off(signal, handler))
  }

  const spawnFunction = (overrides: any = {}): any => {
    return new Promise(async (resolve: any, reject: any) => {
      _.defaults(overrides, {
        onStderrData: false,
      })

      const { onStderrData } = overrides
      // Copied, so a retry inside Xvfb starts from the same arguments as the first attempt
      let args = [...baseArgs]
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
        // Ask interactive mode to print a ready sentinel on stdout
        args.push('--emit-when-ready')
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

      if (handoff.signal) {
        return resolve(signalExitCode(handoff.signal))
      }

      function resolveOn (event: any): any {
        return function (code: any, signal: NodeJS.Signals): void {
          debug('child event fired %o', { event, code, signal })

          if (signal) {
            if (signal === 'SIGINT') {
              resolve(0)
            } else {
              resolve(signalExitCode(signal))
            }

            return
          }

          resolve(code ?? 1)
        }
      }

      let detachedOutput: DetachedOutput | undefined

      if (stdioOptions.detached) {
        try {
          detachedOutput = await openDetachedOutput()
        } catch (err) {
          return reject(err)
        }

        if (handoff.signal) {
          await discardDetachedOutput(detachedOutput)

          return resolve(signalExitCode(handoff.signal))
        }

        stdioOptions.stdio = ['ignore', detachedOutput.outFd, detachedOutput.errFd]
      }

      let child: cp.ChildProcess

      try {
        child = cp.spawn(executable, args, stdioOptions)
      } catch (err) {
        if (detachedOutput) {
          await discardDetachedOutput(detachedOutput)
        }

        return reject(err)
      }

      // A detached app's exit is reported by waiting on its output, so what it printed
      // just before exiting is not cut off by the CLI exiting first
      if (!detachedOutput) {
        child.on('close', resolveOn('close'))

        child.on('exit', resolveOn('exit'))
      }

      child.on('error', reject)

      // A detached app outlives the CLI, so it gets no signal forwarding and nothing that keeps the CLI alive
      if (detachedOutput) {
        const output = detachedOutput
        const filteredStderr = pipeToFilteredStderr()

        startingChild = child

        let ready: boolean
        let code: number

        try {
          ({ ready, code } = await waitForReadyMessage(output.outPath, output.errPath, child, (chunk) => {
            if (onStderrData && onStderrData(chunk.toString())) {
              return
            }

            filteredStderr.write(chunk)
          }))
        } catch (err) {
          killApp(child)
          await removeDetachedOutput(output)

          return reject(err)
        } finally {
          filteredStderr.end()

          await closeDetachedOutput(output)
        }

        // Renamed while an interrupt still stops the app, so no app is handed off under the old names
        const named = ready && !handoff.signal ? await nameForApp(output, child.pid) : output

        // An app that was told to stop after it printed the ready message is still shutting down.
        // It stays the starting child until it has exited, so another interrupt still kills it.
        if (ready && handoff.signal) {
          await waitForExit(child)
        }

        startingChild = undefined

        if (ready && !handoff.signal) {
          child.unref()
          handoff.done = true
          disarmInterrupts()
          stdout.write(`Cypress is running in the background. Its output is written to "${named.outPath}" and "${named.errPath}"\n`)
          resolve(0)
        } else {
          await removeDetachedOutput(named)
          resolve(handoff.signal ? signalExitCode(handoff.signal) : code)
        }

        return
      }

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

        const sourceStream = pipeToFilteredStderr()

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

  return Object.assign(spawnFunction, {
    handedOff: () => handoff.done,
    interruptedBy: () => handoff.signal,
    isDetached: () => Boolean(options.detached),
    armInterrupts,
    disarmInterrupts,
  })
}

const STOP_GRACE_MS = 5000

// Resolves once the child has exited, killing it if it ignores the signal it was sent
async function waitForExit (child: cp.ChildProcess): Promise<void> {
  const exited = (child.exitCode ?? null) !== null || Boolean(child.signalCode)

  if (exited) {
    return
  }

  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      killApp(child, 'SIGKILL')
      resolve()
    }, STOP_GRACE_MS)

    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

async function spawnInXvfb (spawn: ReturnType<typeof createSpawnFunction>): Promise<number> {
  try {
    try {
      await xvfb.start({ detached: spawn.isDetached() })
    } catch (err) {
      const signal = spawn.interruptedBy()

      // An interrupt stops a Xvfb that is still starting, so this failure is the interrupt working
      if (signal) {
        debug('xvfb was stopped by %s while it started', signal)

        return signalExitCode(signal)
      }

      throw err
    }

    debug('xvfb started')
    const code = await userFriendlySpawn(spawn)

    return code
  } finally {
    if (spawn.handedOff()) {
      debug('app was handed off, leaving xvfb running')
      xvfb.release()
    } else {
      await xvfb.stop()
    }
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
    // An interrupted app is not retried: the person who stopped it does not want a second one
    if (code !== 0 && brokenGtkDisplay && !spawn.interruptedBy()) {
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
  const executable = util.getEnv('CYPRESS_RUN_BINARY') ?
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

  const env = options.env ?? process.env
  const needsXvfb = xvfb.isNeeded(env)

  debug('needs to start own Xvfb?', needsXvfb)

  const stdio = options.stdio ?? getStdioStrategy(needsXvfb)
  const dev = options.dev ?? false
  const detached = options.detached ?? false

  const spawn = createSpawnFunction(executable, decoratedArgs, { stdio, dev, detached, env })

  let code: number

  // Armed before Xvfb starts, and kept until it is stopped, so no interrupt can end the CLI
  // between the two and leave a Xvfb in a session of its own that no app ever connects to
  if (detached) {
    spawn.armInterrupts()
  }

  try {
    if (needsXvfb) {
      debug('starting xvfb')

      code = await spawnInXvfb(spawn)
    } else {
      // if we are on linux and there's already a DISPLAY
      // set, then we may need to rerun cypress after
      // spawning our own Xvfb server
      const linuxWithDisplayEnv = util.isPossibleLinuxWithIncorrectDisplay()

      debug('linuxWithDisplayEnv', linuxWithDisplayEnv)

      code = await userFriendlySpawn(spawn, linuxWithDisplayEnv)
    }
  } finally {
    spawn.disarmInterrupts()
    reraiseInterrupt(spawn.interruptedBy())
  }

  return code
}

// Listening for the signal while a detached app started took away its default action. A host with
// no handler of its own is left to the default once the app and its Xvfb are stopped, so Ctrl-C
// ends it as it would have without this CLI.
function reraiseInterrupt (signal: NodeJS.Signals | undefined): void {
  if (signal && process.listenerCount(signal) === 0) {
    debug('re-raising %s now that the app is stopped', signal)
    process.kill(process.pid, signal)
  }
}
