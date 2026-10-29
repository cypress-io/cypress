import os from 'os'
import path from 'path'
import cp from 'child_process'
import fs from 'fs-extra'
import Bluebird from 'bluebird'
import Xvfb from '@cypress/xvfb'
import { stripIndent } from 'common-tags'
import Debug from 'debug'
import { throwFormErrorText, errors } from '../errors'
import util from '../util'

const debug: any = Debug('cypress:cli')
const debugXvfb: any = Debug('cypress:xvfb')

debug.Debug = debugXvfb.Debug = Debug

const xvfbOptions: any = {
  displayNum: process.env.XVFB_DISPLAY_NUM,
  timeout: 30000, // milliseconds
  // need to explicitly define screen otherwise electron will crash
  // https://github.com/cypress-io/cypress/issues/6184
  xvfb_args: ['-screen', '0', '1280x1024x24'],
  onStderrData (data: any): void {
    if (debugXvfb.enabled) {
      debugXvfb(data.toString())
    }
  },
}

// Starts Xvfb in a session of its own with no pipes to the CLI, so an app that keeps running
// after the CLI exits keeps its display when a host ends the CLI's process group or closes its
// output. @cypress/xvfb offers no option for this, so only the spawn is replaced and the display
// choice, lock file wait and timeout stay the library's.
// Once the CLI has exited nothing is left to stop this Xvfb, so `-terminate` has it exit, and remove
// its lock file, when its last client disconnects: when the app closes or crashes.
// The library ships no usable types for the members the override reaches into
const XvfbBase: any = Xvfb

interface StderrFile {
  dir: string
  file: string
  fd: number
}

// A file rather than a pipe: once the CLI exits, Xvfb's next write to a pipe would end it
async function openStderrFile (): Promise<StderrFile> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cypress-xvfb-'))
  const file = path.join(dir, 'stderr')

  try {
    return { dir, file, fd: await fs.open(file, 'wx', 0o600) }
  } catch (err) {
    await fs.remove(dir).catch(() => undefined)

    throw err
  }
}

export class DetachedXvfb extends XvfbBase {
  _stderrFile?: StderrFile

  // Without it the class takes no arguments as far as the type checker can tell

  constructor (options: any) {
    super(options)
  }

  // What Xvfb prints is only read when it fails to start, so it reaches DEBUG=cypress:xvfb and
  // the error as it does for an Xvfb started with pipes. Without a file for it, Xvfb still starts.
  start (cb?: (err: Error | null, proc?: cp.ChildProcess) => void): void {
    openStderrFile().catch((err) => {
      debug('no file for the output of Xvfb, discarding it', err)
    }).then((stderrFile) => {
      this._stderrFile = stderrFile ?? undefined

      super.start(async (err: any, proc?: cp.ChildProcess) => {
        await this._drainStderr(err)
        cb?.(err, proc)
      })
    })
  }

  // Removing the file once Xvfb has started leaves it writing to a file nobody can open, so
  // nothing is left in the temp directory for an Xvfb that outlives the CLI
  async _drainStderr (err: any): Promise<void> {
    const stderrFile = this._stderrFile

    if (!stderrFile) {
      return
    }

    this._stderrFile = undefined

    try {
      await fs.close(stderrFile.fd)

      if (!err) {
        return
      }

      const output = (await fs.readFile(stderrFile.file, 'utf8')).trim()

      if (output) {
        this._onStderrData(output)

        if (err.nonZeroExitCode) {
          err.message = `${err.message}:\n${output}`
        }
      }
    } catch {
      // Best effort: the start error is reported either way
    } finally {
      await fs.remove(stderrFile.dir).catch(() => undefined)
    }
  }

  _spawnProcess (lockFileExists: boolean, onAsyncSpawnError: (err: Error) => void): void {
    const display = this.display()

    if (lockFileExists) {
      if (!this._reuse) {
        throw new Error(`Display ${display} is already in use and the "reuse" option is false.`)
      }

      return
    }

    const stderr = this._stderrFile?.fd ?? 'ignore'
    const proc = cp.spawn('Xvfb', [display, '-terminate', ...this._xvfb_args], { detached: true, stdio: ['ignore', 'ignore', stderr] })

    this._process = proc

    proc.once('error', onAsyncSpawnError)

    proc.once('exit', (code: number | null, signal: NodeJS.Signals | null) => {
      if (code !== 0) {
        const err: any = new Error(code === null ? `Xvfb was killed by ${signal}` : `Xvfb exited with code ${code}`)

        err.nonZeroExitCode = true
        onAsyncSpawnError(err)
      }
    })

    proc.unref()
  }
}

const xvfb: any = Bluebird.promisifyAll(new Xvfb(xvfbOptions))

// The instance that was started, so `stop` ends that one. Each detached launch gets its own, since
// the Xvfb a previous one left for its app may still hold its display.
let running: any = xvfb

export const _debugXvfb = debugXvfb

export const _xvfb = xvfb

export const _xvfbOptions = xvfbOptions

export async function start ({ detached = false }: { detached?: boolean } = {}): Promise<any> {
  debug('Starting Xvfb', { detached })

  running = detached ? Bluebird.promisifyAll(new DetachedXvfb(xvfbOptions)) : xvfb

  try {
    await running.startAsync()

    return null
  } catch (e: any) {
    if (e.nonZeroExitCode === true) {
      const raiseErrorFn = throwFormErrorText(errors.nonZeroExitCodeXvfb)

      await raiseErrorFn(e)
    }

    if (e.known) {
      throw e
    }

    const raiseErrorFn = throwFormErrorText(errors.missingXvfb)

    await raiseErrorFn(e)
  }
}

export async function stop (): Promise<null> {
  debug('Stopping Xvfb')

  try {
    await running.stopAsync()

    return null
  } catch (e) {
    return null
  }
}

// Leaves a detached Xvfb running for the app it was started for. The CLI gets its own DISPLAY back
// and forgets that Xvfb, so a later launch from the same process neither uses nor stops it.
export function release (): void {
  running._restoreDisplayEnvVariable()
  running = xvfb
}

export function isNeeded (env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.ELECTRON_RUN_AS_NODE) {
    debug('Environment variable ELECTRON_RUN_AS_NODE detected, xvfb is not needed')

    return false // xvfb required for electron processes only.
  }

  if (os.platform() !== 'linux') {
    return false
  }

  if (env.DISPLAY) {
    const issueUrl = util.getGitHubIssueUrl(4034)

    const message = stripIndent`
      DISPLAY environment variable is set to ${env.DISPLAY} on Linux
      Assuming this DISPLAY points at working X11 server,
      Cypress will not spawn own Xvfb

      NOTE: if the X11 server is NOT working, Cypress will exit without explanation,
        see ${issueUrl}
      Solution: Unset the DISPLAY variable and try again:
        DISPLAY= npx cypress run ...
    `

    debug(message)

    return false
  }

  debug('undefined DISPLAY environment variable')
  debug('Cypress will spawn its own Xvfb')

  return true
}

  // async method, resolved with Boolean
export async function verify (): Promise<boolean> {
  try {
    await xvfb.startAsync()

    return true
  } catch (err: any) {
    debug('Could not verify xvfb: %s', err.message)

    return false
  } finally {
    await xvfb.stopAsync()
  }
}

export default {
  _debugXvfb,
  _xvfb,
  _xvfbOptions,
  start,
  stop,
  release,
  isNeeded,
  verify,
}
