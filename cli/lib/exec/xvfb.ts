import os from 'os'
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

const xvfb: any = Bluebird.promisifyAll(new Xvfb(xvfbOptions))

export const _debugXvfb = debugXvfb

export const _xvfb = xvfb

export const _xvfbOptions = xvfbOptions

export async function start (): Promise<any> {
  debug('Starting Xvfb')

  try {
    await xvfb.startAsync()

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
    await xvfb.stopAsync()

    return null
  } catch (e) {
    return null
  }
}

export function isNeeded (): boolean {
  if (process.env.ELECTRON_RUN_AS_NODE) {
    debug('Environment variable ELECTRON_RUN_AS_NODE detected, xvfb is not needed')

    return false // xvfb required for electron processes only.
  }

  if (os.platform() !== 'linux') {
    return false
  }

  if (process.env.DISPLAY) {
    const issueUrl = util.getGitHubIssueUrl(4034)

    const message = stripIndent`
      DISPLAY environment variable is set to ${process.env.DISPLAY} on Linux
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
  isNeeded,
  verify,
}
