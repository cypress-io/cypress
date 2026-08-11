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

// The real CLI, which is what these tests exist to exercise. It requires `cli/dist`,
// so the workspace has to be built (`yarn build`, or `cd cli && yarn build-cli`).
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
  /** Present once an instance is reachable; the human rendering leads with it. */
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
  /** Runs the real `cypress tap` CLI. Prepend '--json' for a machine-readable result. */
  tap (args: string[]): Promise<TapResult>
  status (): Promise<TapStatus>
  /** Fires `tap run` and returns immediately — returning does not mean it started. */
  requestRun (spec: string): Promise<TapResult>
  /** Polls status until `match` holds, or fails with the last status and open-mode output. */
  waitForStatus (match: (status: TapStatus) => boolean, label: string): Promise<TapStatus>
  /** Requests a run, then polls until a verdict for *this* run lands. */
  runSpec (spec: string): Promise<TapStatus>
  /** Kills the process tree but leaves the instance record behind, so the CLI sees a
   * record whose writer is gone — the STALE_INSTANCE path. */
  terminate (): Promise<void>
  kill (): Promise<void>
}

/** What a boot strategy has to provide for `buildInstance` to drive it. */
interface BootedInstance {
  projectRoot: string
  /** Kills the process tree, leaving the instance record on disk. */
  terminate (): Promise<void>
  /** Extra diagnostic context appended to failures — the boot output, where capturable. */
  context (): string
  /** Non-null once the booting process is gone, so polling can fail fast. */
  exitReason (): string | null
}

const buildInstance = async (booted: BootedInstance): Promise<TapInstance> => {
  const { projectRoot, terminate } = booted

  const kill = async (): Promise<void> => {
    await terminate()
    await fs.remove(CACHE_FOLDER)
  }

  const status = async (): Promise<TapStatus> => {
    // status always exits 0 for a determinable stage, so its own output is the signal —
    // but it renders for humans unless asked for JSON.
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
        if (current.status !== 'not connected' && current.status !== 'browser not selected') {
          debug('instance ready at stage %s', current.status)

          return
        }
      } catch (err: any) {
        last = err.message
      }

      await delay(POLL_INTERVAL_MS)
    }

    return failWithContext(`the instance never became reachable within ${READY_TIMEOUT_MS}ms; last status was "${last}"`)
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
    terminate,
    kill,
  }
}

const prepareProject = async (project: ProjectFixtureDir): Promise<string> => {
  const projectRoot = await Fixtures.scaffoldProject(project)

  await fs.remove(CACHE_FOLDER)
  await seedWelcomeDismissed(projectRoot)

  return projectRoot
}

/**
 * Boots a real `cypress open` session by spawning the CLI, and hands back a handle for
 * driving it with the real `cypress tap` CLI. Nothing here is stubbed: the instance
 * writes its own record, serves its own liveness probe, and attaches its own browser.
 *
 * Spawning directly — rather than through the Module API — is what buys the three
 * properties this harness leans on: a per-instance env, captured boot output, and a
 * child handle to kill. See `openTapInstanceViaModuleApi` for the contrast.
 */
export const openTapInstance = async (project: ProjectFixtureDir): Promise<TapInstance> => {
  const projectRoot = await prepareProject(project)

  // detached so the whole tree (CLI -> Electron -> browser) can be signalled at once.
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

  return buildInstance({
    projectRoot,
    // The CLI spawns the Electron process which spawns the browser, so signalling the
    // CLI alone leaves the tree behind.
    terminate: async () => {
      if (child.exitCode === null && child.pid) {
        await new Promise<void>((resolve) => treeKill(child.pid!, 'SIGKILL', () => resolve()))
      }
    },
    context: () => output || '(no output captured)',
    exitReason: () => (child.exitCode === null ? null : `exited with ${child.exitCode}`),
  })
}

/** The pid that wrote the record for `projectRoot`, which is the process to signal. */
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

/**
 * Boots the same session through the documented Module API — `cypress.open()` — instead
 * of spawning the CLI, so the public programmatic entry is covered too. It exercises
 * `normalizeModuleOptions` and `processOpenOptions`, which the spawn path skips.
 *
 * It is deliberately not the default, because `exec/open.ts` forwards only
 * `{ dev, detached }` to `spawn.start` and drops that function's `env` and `stdio`
 * options. Three consequences, all visible here:
 *
 *   1. The child inherits *this* process's env, so the only way to steer it is to
 *      mutate ours — restored on kill, but visible to anything else sharing the process.
 *   2. stdio comes from the CLI's own strategy ('inherit'), so boot output cannot be
 *      captured per instance; a failure has to be read out of the mocha output.
 *   3. `spawn.start` resolves on process *exit*, so there is no child handle. Cleanup
 *      goes through the pid in the instance record — which does not exist if the
 *      instance never booted, exactly when cleanup matters most.
 */
export const openTapInstanceViaModuleApi = async (project: ProjectFixtureDir): Promise<TapInstance> => {
  const projectRoot = await prepareProject(project)

  const overrides: Record<string, string | undefined> = {
    CYPRESS_CONFIG_ENV: CONFIG_ENV,
    CYPRESS_CACHE_FOLDER: CACHE_FOLDER,
    // Reserved: the CLI sets it for its own child and warns when handed one.
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
        const pid = await recordedPid(projectRoot)

        if (pid) {
          await new Promise<void>((resolve) => treeKill(pid, 'SIGKILL', () => resolve()))
        }

        applyEnv(previous)
      },
      context: () => 'stdio is inherited through the Module API, so the instance\'s own output is above, interleaved with the test output',
      exitReason: () => settled,
    })
  } catch (err) {
    applyEnv(previous)

    throw err
  }
}
