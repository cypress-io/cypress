import { log } from '../log'
import type { FoundBrowser, Browser, PathData } from '../types'
import { notInstalledErr } from '../errors'
import { utils } from '../utils'
import os from 'os'
import { promises as fs } from 'fs'
import path from 'path'
import Bluebird from 'bluebird'
import which from 'which'

async function isFirefoxSnap (binary: string): Promise<boolean> {
  try {
    const binaryPath = await which(binary)

    // read the first 16kb, don't read the entire file into memory in case it is a binary
    const fd = await fs.open(binaryPath, 'r')
    // @ts-ignore - needs @types/node at least 16
    const { buffer, bytesRead } = await fd.read<Buffer>({ length: 16384 })

    fd.close()

    return buffer.slice(0, bytesRead).toString('utf8').includes('exec /snap/bin/firefox')
  } catch (err) {
    log('failed to check if Firefox is a snap, assuming it isn\'t %o', { err, binary })

    return false
  }
}

function getLinuxBrowser (
  name: string,
  binary: string,
  versionRegex: RegExp,
): Promise<FoundBrowser> {
  const foundBrowser: any = {
    name,
    path: binary,
  }

  const getVersion = (stdout: string) => {
    const m = versionRegex.exec(stdout)

    if (m) {
      return m[1]
    }

    log(
      'Could not extract version from stdout using regex: %o', {
        stdout,
        versionRegex,
      },
    )

    throw notInstalledErr(binary)
  }

  const logAndThrowError = (err: Error) => {
    log(
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
      log('chromium is running as a snap, changing profile path')
      foundBrowser.profilePath = path.join(os.homedir(), 'snap', 'chromium', 'current')

      return
    }

    if (name === 'firefox' && (await isFirefoxSnap(binary))) {
      // if the binary in the path points to a script that calls the snap, set a snap-specific profile path
      // @see https://github.com/cypress-io/cypress/issues/19793
      log('firefox is running as a snap, changing profile path')
      foundBrowser.profilePath = path.join(os.homedir(), 'snap', 'firefox', 'current')

      return
    }
  }

  return getVersionString(binary)
  .tap(maybeSetSnapProfilePath)
  .then(getVersion)
  .then((version: string): FoundBrowser => {
    foundBrowser.version = version

    return foundBrowser
  })
  .catch(logAndThrowError)
}

export function getVersionString (path: string) {
  log('finding version string using command "%s --version"', path)

  return Bluebird.resolve(utils.getOutput(path, ['--version']))
  .timeout(30000, `Timed out after 30 seconds getting browser version for ${path}`)
  .then((val) => val.stdout)
  .then((val) => val.trim())
  .then((val) => {
    log('stdout: %s', val)

    return val
  })
}

export function getVersionNumber (version: string, browser: Browser) {
  const regexExec = browser.versionRegex.exec(version) as Array<string>

  return regexExec ? regexExec[1] : version
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
