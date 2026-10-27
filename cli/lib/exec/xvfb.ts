import os from 'os'
import cp from 'child_process'
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

export class DetachedXvfb extends XvfbBase {
  // Without it the class takes no arguments as far as the type checker can tell

  constructor (options: any) {
    super(options)
  }

  _spawnProcess (lockFileExists: boolean, onAsyncSpawnError: (err: Error) => void): void {
    const display = this.display()

    if (lockFileExists) {
      if (!this._reuse) {
        throw new Error(`Display ${display} is already in use and the "reuse" option is false.`)
      }

      return
    }

    const proc = cp.spawn('Xvfb', [display, '-terminate', ...this._xvfb_args], { detached: true, stdio: 'ignore' })

    this._process = proc

    proc.once('error', onAsyncSpawnError)

    proc.once('exit', (code: number | null) => {
      if (code !== 0) {
        const err: any = new Error(`Xvfb exited with code ${code}`)

        err.nonZeroExitCode = true
        onAsyncSpawnError(err)
      }
    })

    proc.unref()
  }
}

const xvfb: any = Bluebird.promisifyAll(new Xvfb(xvfbOptions))
const detachedXvfb: any = Bluebird.promisifyAll(new DetachedXvfb(xvfbOptions))

// The instance that was started, so `stop` ends that one
let running: any = xvfb

export const _debugXvfb = debugXvfb

export const _xvfb = xvfb

export const _xvfbOptions = xvfbOptions

export async function start ({ detached = false }: { detached?: boolean } = {}): Promise<any> {
  debug('Starting Xvfb', { detached })

  running = detached ? detachedXvfb : xvfb

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
  _detachedXvfb: detachedXvfb,
  start,
  stop,
  isNeeded,
  verify,
}
