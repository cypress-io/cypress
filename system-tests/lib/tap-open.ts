import path from 'path'
import os from 'os'
import cp from 'child_process'
import fs from 'fs-extra'
import ospath from 'ospath'
import _ from 'lodash'
import treeKill from 'tree-kill'
import Debug from 'debug'
import pkg from '@packages/root'
import { GET_MAJOR_VERSION_FOR_CONTENT } from '@packages/types'
import { toHashName } from '@packages/server/lib/util/app_data'
import Fixtures from './fixtures'
import type { ProjectFixtureDir } from './fixtureDirs'

const debug = Debug('cypress:system-tests:tap-open')

// The CLI requires `cli/dist` from `yarn build` or `cd cli && yarn build-cli`.
const CLI_BIN = path.join(__dirname, '..', '..', 'cli', 'bin', 'cypress')

// CYPRESS_CONFIG_ENV places the app-data dir holding saved state, so 'test' keeps this
// suite out of the developer's own `cy/development` state. It is NOT a free-form
// namespace: config/app.json is keyed by it and `cloud/routes.ts` reads api_url from
// that entry at module load, so only development | test | staging | production work.
const CONFIG_ENV = 'test'

// The instances dir lives under the cache root, so a pid-unique folder means discovery
// can only ever find this suite's own instance — `reason: 'only'`, no --instance needed.
const CACHE_FOLDER = path.join(os.tmpdir(), `cy-tap-open-${process.pid}`)

const READY_TIMEOUT_MS = 120000
const SETTLE_TIMEOUT_MS = 120000
const POLL_INTERVAL_MS = 500

// Mirrors app_data.path(): join(ospath.data(), PRODUCT_NAME, 'cy', folder, ...) where
// folder is CYPRESS_CONFIG_ENV. Computed rather than read from app_data, because
// app_data reads process.env at call time and mutating it here would move the app-data
// dir for every other system test sharing this mocha process.
const APP_DATA_PROJECTS = path.join(ospath.data(), (pkg as any).productName || (pkg as any).name, 'cy', CONFIG_ENV, 'projects')

export interface TapResult {
  stdout: string
  stderr: string
  exitCode: number
  json: <T = any>() => T
}

export interface TapStatus {
  status: string
  startedAt?: string | null
  /** Set once the instance is reachable. */
  pid?: number
  [key: string]: unknown
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const spawnEnv = (): NodeJS.ProcessEnv => {
  return {
    // The cy-in-cy markers would redirect app data and change how the browser is
    // launched; a real `cypress open` session must not look like a nested one.
    // CYPRESS_INTERNAL_ENV is reserved — the CLI sets it for its own child and warns
    // (then misbehaves) if it is handed one.
    ..._.omit(process.env, 'CYPRESS_INTERNAL_E2E_TESTING_SELF', 'CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT', 'CYPRESS_INTERNAL_ENV'),
    CYPRESS_CONFIG_ENV: CONFIG_ENV,
    CYPRESS_CACHE_FOLDER: CACHE_FOLDER,
  }
}

/**
 * Open mode only auto-launches the browser once the major-version welcome screen has
 * been dismissed — `ProjectLifecycleManager.setActiveBrowserByNameOrPath` returns early
 * otherwise, leaving no browser attached and every tap command reporting
 * NO_BROWSER_ATTACHED. There is no browser to click Continue in, so seed the dismissal.
 *
 * Global preferences resolve through `savedState.create()` with no project root, which
 * lands in `__global__` unless the server's cwd holds a config file, in which case it
 * lands under the project's hash. Which one applies depends on whether cwd has been
 * changed by the time preferences are read, so write both.
 */
const seedWelcomeDismissed = async (projectRoot: string): Promise<void> => {
  const state = { majorVersionWelcomeDismissed: { [GET_MAJOR_VERSION_FOR_CONTENT()]: Date.now() } }

  for (const dir of ['__global__', toHashName(projectRoot)]) {
    const file = path.join(APP_DATA_PROJECTS, dir, 'state.json')

    await fs.outputJson(file, state)
    debug('seeded welcome dismissal at %s', file)
  }
}

const runTap = (args: string[], cwd: string, cacheFolder = CACHE_FOLDER): Promise<TapResult> => {
  return new Promise((resolve, reject) => {
    debug('tap %o', args)

    const child = cp.spawn(process.execPath, [CLI_BIN, 'tap', ...args], {
      cwd,
      env: { ...spawnEnv(), CYPRESS_CACHE_FOLDER: cacheFolder },
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (buf) => {
      stdout += buf.toString()
    })

    child.stderr.on('data', (buf) => {
      stderr += buf.toString()
    })

    child.on('error', reject)

    child.on('close', (code) => {
      debug('tap %o exited %d: %s', args, code, stdout.trim())

      resolve({
        stdout,
        stderr,
        exitCode: code ?? -1,
        json: <T>() => {
          try {
            return JSON.parse(stdout) as T
          } catch (err) {
            throw new Error(`tap ${args.join(' ')} did not print JSON.\nstdout: ${stdout}\nstderr: ${stderr}`)
          }
        },
      })
    })
  })
}

/**
 * Runs the CLI against an instances dir guaranteed to be empty, for the discovery
 * failure paths. Uses its own cache folder so it cannot see an instance another suite
 * in this same mocha process has booted, whatever the declaration order.
 */
export const tapWithoutInstance = async (args: string[]): Promise<TapResult> => {
  const emptyCache = path.join(os.tmpdir(), `cy-tap-open-empty-${process.pid}`)

  await fs.remove(emptyCache)

  return runTap(args, os.tmpdir(), emptyCache)
}

export interface TapInstance {
  projectRoot: string
  tap (args: string[]): Promise<TapResult>
  status (): Promise<TapStatus>
  /** Fires `tap run` and returns immediately — returning does not mean it started. */
  requestRun (spec: string): Promise<TapResult>
  /** Polls until `match` holds, with the last status and open output on timeout. */
  waitForStatus (match: (status: TapStatus) => boolean, label: string): Promise<TapStatus>
  runSpec (spec: string): Promise<TapStatus>
  /**
   * Freezes the server (and its process tree where supported): the record stays
   * and the pid stays alive while nothing answers, which is what reports
   * STALE_INSTANCE rather than NO_INSTANCE. `kill` needs no resume first.
   */
  suspend (): Promise<void>
  resume (): Promise<void>
  /** Kills the process tree but leaves the instance record for stale-record tests. */
  terminate (): Promise<void>
  kill (): Promise<void>
}

export interface OpenTapInstanceOptions {
  /**
   * Boot alongside the instances already running rather than from an empty
   * instances dir, and leave that shared dir in place when killed — so the
   * instances it was booted beside stay discoverable.
   */
  additional?: boolean
}

interface BootedInstance {
  projectRoot: string
  terminate (): Promise<void>
  suspend (): Promise<void>
  resume (): Promise<void>
  /** Boot output appended to timeout errors when available. */
  context (): string
  /** Non-null once the booting process is gone, so polling can fail fast. */
  exitReason (): string | null
}

const buildInstance = async (booted: BootedInstance, options: OpenTapInstanceOptions = {}): Promise<TapInstance> => {
  const { projectRoot, terminate } = booted

  const kill = async (): Promise<void> => {
    await terminate()

    if (!options.additional) {
      await fs.remove(CACHE_FOLDER)
    }
  }

  const status = async (): Promise<TapStatus> => {
    // status exits 0 for any determinable stage, so the JSON field is the signal.
    return (await runTap(['--json', 'status'], projectRoot)).json<TapStatus>()
  }

  const failWithContext = async (message: string): Promise<never> => {
    await kill()

    throw new Error(`${message}\n\n--- cypress open context ---\n${booted.context()}`)
  }

  const waitForReady = async (): Promise<void> => {
    const deadline = Date.now() + READY_TIMEOUT_MS
    let last = 'never polled'

    while (Date.now() < deadline) {
      const gone = booted.exitReason()

      if (gone) {
        return failWithContext(`cypress open ${gone} before becoming reachable`)
      }

      try {
        const current = await status()

        last = current.status

        // "not connected" means no record yet; "browser not selected" means the record
        // exists but carries no CDP url, so the browser is still launching and every
        // read would fail NO_BROWSER_ATTACHED. Ready is the first stage past both.
        //
        // And it must be this instance: with another already running, discovery
        // falls back to that one until this one's own record lands.
        const isThisInstance = typeof current.projectRoot === 'string'
          && path.resolve(current.projectRoot) === path.resolve(projectRoot)

        if (isThisInstance && current.status !== 'not connected' && current.status !== 'browser not selected') {
          debug('instance ready at stage %s', current.status)

          return
        }
      } catch (err: any) {
        last = err.message
      }

      await delay(POLL_INTERVAL_MS)
    }

    return failWithContext(`the instance never became reachable within ${READY_TIMEOUT_MS}ms; last status was "${last}" (waiting on ${projectRoot})`)
  }

  const waitForStatus = async (match: (status: TapStatus) => boolean, label: string): Promise<TapStatus> => {
    const deadline = Date.now() + SETTLE_TIMEOUT_MS
    let last: TapStatus | undefined

    while (Date.now() < deadline) {
      const current = await status()

      last = current

      if (match(current)) {
        return current
      }

      await delay(POLL_INTERVAL_MS)
    }

    return failWithContext(`never reached ${label} within ${SETTLE_TIMEOUT_MS}ms; last status was ${JSON.stringify(last)}`)
  }

  const requestRun = async (spec: string): Promise<TapResult> => {
    const requested = await runTap(['run', spec], projectRoot)

    if (requested.exitCode !== 0) {
      return failWithContext(`tap run ${spec} exited ${requested.exitCode}: ${requested.stdout}${requested.stderr}`)
    }

    return requested
  }

  const runSpec = async (spec: string): Promise<TapStatus> => {
    // A rerun leaves the previous verdict readable until the incoming run starts, so the
    // only safe signal is a verdict whose startedAt differs from the one before it.
    const before = await status()

    await requestRun(spec)

    return waitForStatus(
      (current) => (current.status === 'passed' || current.status === 'failed') && current.startedAt !== before.startedAt,
      `a verdict for ${spec}`,
    )
  }

  await waitForReady()

  return {
    projectRoot,
    tap: (args: string[]) => runTap(args, projectRoot),
    status,
    requestRun,
    waitForStatus,
    runSpec,
    suspend: booted.suspend,
    resume: booted.resume,
    terminate,
    kill,
  }
}

const prepareProject = async (project: ProjectFixtureDir, options: OpenTapInstanceOptions): Promise<string> => {
  const projectRoot = await Fixtures.scaffoldProject(project)

  if (!options.additional) {
    await fs.remove(CACHE_FOLDER)
  }

  await seedWelcomeDismissed(projectRoot)

  return projectRoot
}

/**
 * Spawning the CLI gives the harness a per-instance env, captured boot output, and a
 * child handle to kill. See `openTapInstanceViaModuleApi` for the Module API contrast.
 */
export const openTapInstance = async (project: ProjectFixtureDir, options: OpenTapInstanceOptions = {}): Promise<TapInstance> => {
  const projectRoot = await prepareProject(project, options)

  // Electron and the browser outlive the CLI alone, so detach and signal the whole tree.
  const child = cp.spawn(process.execPath, [
    CLI_BIN, 'open',
    '--project', projectRoot,
    '--e2e',
    '--browser', 'chrome',
    '--dev',
  ], { cwd: projectRoot, env: spawnEnv(), detached: true })

  let output = ''

  child.stdout?.on('data', (buf) => {
    output += buf.toString()
  })

  child.stderr?.on('data', (buf) => {
    output += buf.toString()
  })

  const signalTree = async (signal: string): Promise<void> => {
    if (child.exitCode === null && child.pid) {
      await new Promise<void>((resolve) => treeKill(child.pid!, signal, () => resolve()))
    }
  }

  return buildInstance({
    projectRoot,
    terminate: () => signalTree('SIGKILL'),
    suspend: () => process.platform === 'win32' ? signalRecorded(projectRoot, 'SIGSTOP') : signalTree('SIGSTOP'),
    resume: () => process.platform === 'win32' ? signalRecorded(projectRoot, 'SIGCONT') : signalTree('SIGCONT'),
    context: () => output || '(no output captured)',
    exitReason: () => (child.exitCode === null ? null : `exited with ${child.exitCode}`),
  }, options)
}

const recordedPid = async (projectRoot: string): Promise<number | undefined> => {
  const dir = path.join(CACHE_FOLDER, 'instances')
  const entries: string[] = await fs.readdir(dir).catch(() => [])

  for (const entry of entries) {
    if (!entry.endsWith('.json')) {
      continue
    }

    const record = await fs.readJson(path.join(dir, entry)).catch(() => null)

    if (record?.projectRoot && path.resolve(record.projectRoot) === path.resolve(projectRoot)) {
      return record.pid
    }
  }

  return undefined
}

// Windows has no SIGSTOP/SIGCONT, and tree-kill maps every signal to forced
// termination. Suspending the recorded server process keeps its pid live while
// making the instance probe unresponsive.
const setWindowsProcessSuspended = async (pid: number, suspended: boolean): Promise<void> => {
  const method = suspended ? 'NtSuspendProcess' : 'NtResumeProcess'
  const script = `
Add-Type -TypeDefinition @'
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

public static class ProcessControl {
  [DllImport("ntdll.dll")]
  public static extern int NtSuspendProcess(IntPtr processHandle);

  [DllImport("ntdll.dll")]
  public static extern int NtResumeProcess(IntPtr processHandle);
}
'@

$process = [System.Diagnostics.Process]::GetProcessById(${pid})
try {
  $status = [ProcessControl]::${method}($process.Handle)
  if ($status -ne 0) {
    throw "${method} failed with NTSTATUS $status"
  }
} finally {
  $process.Dispose()
}
`

  await new Promise<void>((resolve, reject) => {
    cp.execFile('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script], (err) => {
      if (err) {
        reject(err)

        return
      }

      resolve()
    })
  })
}

const signalRecorded = async (projectRoot: string, signal: 'SIGKILL' | 'SIGSTOP' | 'SIGCONT'): Promise<void> => {
  const pid = await recordedPid(projectRoot)

  if (!pid) {
    throw new Error(`No instance pid recorded for ${projectRoot}`)
  }

  if (process.platform === 'win32' && signal !== 'SIGKILL') {
    await setWindowsProcessSuspended(pid, signal === 'SIGSTOP')

    return
  }

  await new Promise<void>((resolve) => treeKill(pid, signal, () => resolve()))
}

/**
 * Covers the documented `cypress.open()` entry and its option normalization. The Module
 * API inherits this process's env and stdio and exposes no child handle, so this path
 * must mutate env and terminate through the pid in the instance record.
 */
export const openTapInstanceViaModuleApi = async (project: ProjectFixtureDir): Promise<TapInstance> => {
  const projectRoot = await prepareProject(project, {})

  const overrides: Record<string, string | undefined> = {
    CYPRESS_CONFIG_ENV: CONFIG_ENV,
    CYPRESS_CACHE_FOLDER: CACHE_FOLDER,
    // The CLI sets this reserved variable for its own child.
    CYPRESS_INTERNAL_ENV: undefined,
    CYPRESS_INTERNAL_E2E_TESTING_SELF: undefined,
    CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT: undefined,
  }

  const previous = _.mapValues(overrides, (_value, key) => process.env[key])

  const applyEnv = (values: Record<string, string | undefined>) => {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }

  applyEnv(overrides)

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cypress = require('cypress')

  let settled: string | null = null

  // Resolves only when the session closes, so it is fired rather than awaited. `dev`
  // skips the binary verification a monorepo checkout has nothing to verify.
  cypress.open({ project: projectRoot, testingType: 'e2e', browser: 'chrome', dev: true })
  .then(() => {
    settled = 'closed'
  })
  .catch((err: Error) => {
    settled = `failed: ${err.message}`
  })

  try {
    return await buildInstance({
      projectRoot,
      terminate: async () => {
        await signalRecorded(projectRoot, 'SIGKILL')
        applyEnv(previous)
      },
      suspend: () => signalRecorded(projectRoot, 'SIGSTOP'),
      resume: () => signalRecorded(projectRoot, 'SIGCONT'),
      context: () => 'stdio is inherited through the Module API, so the instance\'s own output is above, interleaved with the test output',
      exitReason: () => settled,
    })
  } catch (err) {
    applyEnv(previous)

    throw err
  }
}
