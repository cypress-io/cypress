import Debug from 'debug'
import type { FoundBrowser, Browser } from '@packages/types'
import type { PathData } from '../types'
import { notInstalledErr } from '../errors'
import { getOutput } from '../utils'
import os from 'os'
import { promises as fs } from 'fs'
import path from 'path'
import which from 'which'

const debug = Debug('cypress:launcher:linux')
const debugVerbose = Debug('cypress-verbose:launcher:linux')

const createTimeoutPromise = (timeout: number = 30000, message: string = `Timed out after ${timeout} seconds`) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message))
    }, timeout)
  })
}

async function isFirefoxSnap (binary: string): Promise<boolean> {
  try {
    const result = await Promise.race([getFirefoxSnap(binary), createTimeoutPromise(30000, 'Timed out after 30 seconds checking if Firefox is a snap')]) as Promise<boolean>

    return result
  } catch (err) {
    debug('failed to check if Firefox is a snap, assuming it isn\'t %o', { err, binary })

    return false
  }
}

async function getFirefoxSnap (binary: string): Promise<boolean> {
  const binaryPath = await which(binary)

  // if the bin path or what it's symlinked to start with `/snap/bin`, it's a snap
  if (binaryPath.startsWith('/snap/bin/') || (await fs.realpath(binaryPath)).startsWith('/snap/bin')) return true

  // read the first 16kb, don't read the entire file into memory in case it is a binary
  const fd = await fs.open(binaryPath, 'r')
  const { buffer, bytesRead } = await fd.read<Buffer>({ length: 16384 })

  await fd.close()

  return buffer.slice(0, bytesRead).toString('utf8').includes('exec /snap/bin/firefox')
}

async function getLinuxBrowser (
  name: string,
  binary: string,
  versionRegex: RegExp,
): Promise<FoundBrowser> {
  const foundBrowser: any = {
    name,
    path: binary,
  }

  const getVersion = async (stdout: string) => {
    const m = versionRegex.exec(stdout)

    if (m) {
      return m[1]
    }

    debug(
      'Could not extract version from stdout using regex: %o', {
        stdout,
        versionRegex,
      },
    )

    throw notInstalledErr(binary)
  }

  const logAndThrowError = (err: Error) => {
    debugVerbose(
      'Received error detecting browser binary: "%s" with error:',
      binary,
      err.message,
    )

    throw notInstalledErr(binary)
  }

  const maybeSetSnapProfilePath = async (versionString: string) => {
    if (os.platform() !== 'linux') return

    if (name === 'chromium' && versionString.endsWith('snap')) {
      // when running as a snap, chromium can only write to certain directories
      // @see https://github.com/cypress-io/cypress/issues/7020
      debug('chromium is running as a snap, changing profile path')
      foundBrowser.profilePath = path.join(os.homedir(), 'snap', 'chromium', 'current')

      return
    }

    if (name === 'firefox' && await isFirefoxSnap(binary)) {
      // if the binary in the path points to a script that calls the snap, set a snap-specific profile path
      // @see https://github.com/cypress-io/cypress/issues/19793
      debug('firefox is running as a snap, changing profile path')
      foundBrowser.profilePath = path.join(os.homedir(), 'snap', 'firefox', 'current')

      return
    }
  }

  try {
    const versionString = await getVersionString(binary)

    await maybeSetSnapProfilePath(versionString)
    const version = await getVersion(versionString)

    foundBrowser.version = version

    return foundBrowser as FoundBrowser
  } catch (err) {
    return logAndThrowError(err as Error)
  }
}

export async function getVersionString (path: string) {
  debugVerbose('finding version string using command "%s --version"', path)

  const timeoutPromise = createTimeoutPromise(30000, `Timed out after 30 seconds getting browser version for ${path}`)
  const { stdout } = await Promise.race([getOutput(path, ['--version']), timeoutPromise]) as { stdout: string }
  const trimmedStdout = stdout.trim()

  debugVerbose('stdout for "%s --version": %s', path, trimmedStdout)

  return trimmedStdout
}

export function getVersionNumber (version: string, browser: Browser) {
  const regexExec = browser.versionRegex.exec(version) as Array<string>

  return (regexExec && regexExec[1]) ?? version
}

export function getPathData (pathStr: string): PathData {
  return { path: pathStr }
}

export function detect (browser: Browser) {
  return getLinuxBrowser(
    browser.name,
    browser.binary as string,
    browser.versionRegex,
  )
}
