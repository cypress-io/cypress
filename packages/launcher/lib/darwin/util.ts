import Debug from 'debug'
import { notInstalledErr } from '../errors'
import { utils } from '../utils'
import fs from 'fs-extra'
import path from 'path'
import plist from 'plist'

const debugVerbose = Debug('cypress-verbose:launcher:darwin:util')

// Detection runs before the app can show its browser list, so a Spotlight index
// that is disabled, rebuilding, or waiting on a stalled network volume must not
// hold the app open for long.
const MDFIND_TIMEOUT = 3000

export type FindAppParams = {
  // The name of the application (e.g. 'Google Chrome.app')
  appName: string
  // The path to the executable within the application (e.g. 'Contents/MacOS/Google Chrome')
  executable: string
  // The CFBundleIdentifier in the Info.plist (e.g. 'com.google.Chrome')
  bundleId: string
  // The key from the Info.plist to find the version (e.g. 'KSVersion')
  versionProperty: string
}

type Detectors = {
  [name: string]: {
    [channel: string]: FindAppParams
  }
}

export const browsers: Detectors = {
  chrome: {
    stable: {
      appName: 'Google Chrome.app',
      executable: 'Contents/MacOS/Google Chrome',
      bundleId: 'com.google.Chrome',
      versionProperty: 'KSVersion',
    },
    beta: {
      appName: 'Google Chrome Beta.app',
      executable: 'Contents/MacOS/Google Chrome Beta',
      bundleId: 'com.google.Chrome.beta',
      versionProperty: 'KSVersion',
    },
    canary: {
      appName: 'Google Chrome Canary.app',
      executable: 'Contents/MacOS/Google Chrome Canary',
      bundleId: 'com.google.Chrome.canary',
      versionProperty: 'KSVersion',
    },
  },
  'chrome-for-testing': {
    stable: {
      appName: 'Google Chrome for Testing.app',
      executable: 'Contents/MacOS/Google Chrome for Testing',
      bundleId: 'com.google.chrome.for.testing',
      versionProperty: 'CFBundleShortVersionString',
    },
  },
  chromium: {
    stable: {
      appName: 'Chromium.app',
      executable: 'Contents/MacOS/Chromium',
      bundleId: 'org.chromium.Chromium',
      versionProperty: 'CFBundleShortVersionString',
    },
  },
  firefox: {
    stable: {
      appName: 'Firefox.app',
      executable: 'Contents/MacOS/firefox',
      bundleId: 'org.mozilla.firefox',
      versionProperty: 'CFBundleShortVersionString',
    },
    dev: {
      appName: 'Firefox Developer Edition.app',
      executable: 'Contents/MacOS/firefox',
      bundleId: 'org.mozilla.firefoxdeveloperedition',
      versionProperty: 'CFBundleShortVersionString',
    },
    nightly: {
      appName: 'Firefox Nightly.app',
      executable: 'Contents/MacOS/firefox',
      bundleId: 'org.mozilla.nightly',
      versionProperty: 'CFBundleShortVersionString',
    },
  },
  edge: {
    stable: {
      appName: 'Microsoft Edge.app',
      executable: 'Contents/MacOS/Microsoft Edge',
      bundleId: 'com.microsoft.Edge',
      versionProperty: 'CFBundleShortVersionString',
    },
    beta: {
      appName: 'Microsoft Edge Beta.app',
      executable: 'Contents/MacOS/Microsoft Edge Beta',
      bundleId: 'com.microsoft.Edge.Beta',
      versionProperty: 'CFBundleShortVersionString',
    },
    canary: {
      appName: 'Microsoft Edge Canary.app',
      executable: 'Contents/MacOS/Microsoft Edge Canary',
      bundleId: 'com.microsoft.Edge.Canary',
      versionProperty: 'CFBundleShortVersionString',
    },
    dev: {
      appName: 'Microsoft Edge Dev.app',
      executable: 'Contents/MacOS/Microsoft Edge Dev',
      bundleId: 'com.microsoft.Edge.Dev',
      versionProperty: 'CFBundleShortVersionString',
    },
  },
}

const allBundleIds = () => {
  return Object.values(browsers).flatMap((channels) => Object.values(channels).map(({ bundleId }) => bundleId))
}

function parsePlist (appPath: string): Promise<Record<string, any>> {
  const pl = path.join(appPath, 'Contents', 'Info.plist')

  debugVerbose('reading property file "%s"', pl)

  return fs
  .readFile(pl, 'utf8')
  .then((contents) => plist.parse(contents) as unknown as Record<string, any>)
  .catch((e) => {
    debugVerbose('could not read Info.plist %o', { pl, e })

    throw notInstalledErr('', `Info.plist not found: ${pl}
    ${e.message}`)
  })
}

let spotlightBundles: Promise<Map<string, string[]>> | undefined

/**
 * Asks Spotlight for every browser Cypress knows about, in one query, once.
 *
 * Detection walks browsers one at a time and most of them are not installed on
 * any given machine, so asking per browser would spawn a dozen `mdfind`
 * processes in series every time the app starts.
 */
function findBundlesWithSpotlight (): Promise<Map<string, string[]>> {
  if (!spotlightBundles) {
    spotlightBundles = querySpotlight()
  }

  return spotlightBundles
}

async function querySpotlight (): Promise<Map<string, string[]>> {
  const query = allBundleIds().map((id) => `kMDItemCFBundleIdentifier=="${id}"`).join(' || ')
  const byBundleId = new Map<string, string[]>()

  let appPaths: string[] = []

  try {
    const { stdout } = await utils.execa('mdfind', [query], { timeout: MDFIND_TIMEOUT })

    // Spotlight orders results however it likes, so sort to keep the browser
    // Cypress reports stable from one launch to the next.
    appPaths = stdout.split('\n').map((line) => line.trim()).filter(Boolean).sort()
  } catch (e) {
    debugVerbose('could not run mdfind %o', e)

    return byBundleId
  }

  for (const appPath of appPaths) {
    const info = await parsePlist(appPath).catch(() => undefined)
    const foundBundleId = info?.CFBundleIdentifier

    if (typeof foundBundleId !== 'string') {
      continue
    }

    byBundleId.set(foundBundleId, (byBundleId.get(foundBundleId) ?? []).concat(appPath))
  }

  debugVerbose('spotlight found %o', Object.fromEntries(byBundleId))

  return byBundleId
}

/** the Spotlight query is cached for the life of the process; tests need it fresh */
export function resetSpotlightCache () {
  spotlightBundles = undefined
}

type AppInfo = {
  path: string
  version: string
}

function formApplicationPath (appName: string) {
  return path.join('/Applications', appName)
}

/**
 * Reads an app bundle and confirms it is really the browser we are looking for.
 *
 * A bundle can carry one browser's name while containing another - a Beta install
 * left at `/Applications/Google Chrome.app` still reports a version - so matching
 * the bundle id and confirming the executable exists is what separates a browser
 * we can launch from one that only looks launchable.
 */
async function verifyApp (appPath: string, { executable, bundleId, versionProperty }: FindAppParams): Promise<AppInfo> {
  const info = await parsePlist(appPath)
  const foundBundleId = info.CFBundleIdentifier

  if (foundBundleId !== bundleId) {
    throw notInstalledErr(bundleId, `${appPath} contains ${foundBundleId}, not ${bundleId}`)
  }

  const executablePath = path.join(appPath, executable)

  if (!await fs.pathExists(executablePath)) {
    throw notInstalledErr(bundleId, `${appPath} is missing its executable at ${executablePath}`)
  }

  const version = info[versionProperty]

  if (!version) {
    throw notInstalledErr(bundleId, `${appPath} has no ${versionProperty} in its Info.plist`)
  }

  return { path: executablePath, version: String(version) }
}

/** finds an application and its version */
export async function findApp (findAppParams: FindAppParams): Promise<AppInfo> {
  const { appName, bundleId } = findAppParams

  debugVerbose('looking for app %s bundle id %s', appName, bundleId)

  const wellKnownPath = formApplicationPath(appName)

  try {
    return await verifyApp(wellKnownPath, findAppParams)
  } catch (err) {
    debugVerbose('%s did not verify %o', wellKnownPath, err)
  }

  // Spotlight is a fallback rather than the primary source so that a normal
  // install always resolves the same way, no matter what else it has indexed.
  const candidates = (await findBundlesWithSpotlight()).get(bundleId) ?? []

  for (const appPath of candidates) {
    if (appPath === wellKnownPath) {
      continue
    }

    try {
      return await verifyApp(appPath, findAppParams)
    } catch (err) {
      debugVerbose('%s did not verify %o', appPath, err)
    }
  }

  throw notInstalledErr(bundleId)
}
