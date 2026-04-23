import path from 'path'
import Table from 'cli-table3'
import chalk from 'chalk'

import logger from '../logger'
import {
  Instance,
  readInstances,
  resolveInstance,
} from '../util/instance-discovery'

/**
 * CLI options shared across all `cypress inspect` subcommands.
 */
interface InspectOpts {
  json?: boolean
  instance?: string
}

/**
 * Options for `cypress inspect run <spec>`.
 *
 * - `wait` (`--wait`) polls `inspectSnapshot.activeRun` until the run leaves
 *   the `starting` / `running` states. Exits 0 on `finished`, 1 on `errored`,
 *   124 on timeout.
 * - `timeout` (`--timeout <ms>`) overrides the default wait deadline. Only
 *   meaningful together with `--wait`.
 */
interface RunOpts extends InspectOpts {
  spec?: string
  wait?: boolean
  timeout?: number
}

/**
 * Options for `cypress inspect switch <mode>`.
 *
 * - `mode` is the positional arg (`'e2e'` | `'component'`).
 * - `noRelaunch` (from `--no-relaunch`) skips the browser relaunch and calls
 *   `setAndLoadCurrentTestingType` instead.
 * - `timeout` (from `--timeout <ms>`) overrides the 30 s default when polling
 *   for the relaunch to complete.
 */
interface SwitchOpts extends InspectOpts {
  mode?: string
  noRelaunch?: boolean
  timeout?: number
}

/**
 * Options for `cypress inspect browser open [name]`.
 *
 * - `name` is the positional arg. When omitted, the instance's current
 *   `activeBrowser` is used (Cypress picks a default on project load via
 *   `setInitialActiveBrowser` in `ProjectLifecycleManager`).
 * - `timeout` (from `--timeout <ms>`) overrides the 30 s default while
 *   polling for `browserStatus` to settle at `open`.
 */
interface BrowserOpenOpts extends InspectOpts {
  name?: string
  timeout?: number
}

/**
 * Options for `cypress inspect browser close`.
 *
 * - `timeout` (from `--timeout <ms>`) overrides the 30 s default while
 *   polling for `browserStatus` to settle at `closed`.
 */
interface BrowserCloseOpts extends InspectOpts {
  timeout?: number
}

/**
 * Options for `cypress inspect project open <path>` / `project add <path>`.
 *
 * - `path` is the positional arg. Accepted as an absolute path, a path
 *   relative to the CLI's cwd, or a substring match against a project
 *   already in the instance's recents list.
 * - `timeout` (from `--timeout <ms>`) overrides the 30 s default for
 *   `project open` / `project clear` while polling `projectRoot` for the
 *   transition to land.
 */
interface ProjectPathOpts extends InspectOpts {
  path?: string
  timeout?: number
}

interface ProjectClearOpts extends InspectOpts {
  timeout?: number
}

/**
 * Shape of the `inspectSnapshot` Query result. Mirrors
 * `packages/data-context/graphql/schemaTypes/objectTypes/gql-InspectSnapshot.ts`.
 */
interface InspectSnapshot {
  pid: number
  cypressVersion: string
  projectRoot: string | null
  testingType: 'e2e' | 'component' | null
  browserStatus: 'closed' | 'open' | 'opening' | 'closing' | null
  activeBrowser: {
    name: string
    displayName?: string
    channel?: string
    family?: string
    version?: string
  } | null
  appRoute: 'INTRO' | 'TESTING_TYPE_SELECTION' | 'BROWSER_SELECTION' | 'SPEC_LIST' | 'SPEC_RUNNING' | 'ERROR'
  activeRun: ActiveRun | null
  specCount: number
}

interface ActiveRun {
  specPath: string
  startedAt: string
  endedAt: string | null
  status: 'starting' | 'running' | 'finished'
}

interface SpecFields {
  relative: string
  absolute: string
  specType: string
}

const writeStderr = (msg: string): void => {
  process.stderr.write(msg)
}

/**
 * Tree node used to render spec paths as an ASCII tree. A node with an
 * empty `children` map is a leaf (a spec file). Non-empty nodes are directories.
 */
export interface SpecTreeNode {
  children: Map<string, SpecTreeNode>
}

/**
 * Build a nested tree from a list of POSIX-style relative paths. Paths are
 * split on `/`; empty segments (leading slashes, doubled slashes) are dropped.
 */
export const buildSpecTree = (relativePaths: string[]): SpecTreeNode => {
  const root: SpecTreeNode = { children: new Map() }

  for (const relative of relativePaths) {
    const parts = relative.split('/').filter(Boolean)

    if (!parts.length) {
      continue
    }

    let cursor = root

    for (const part of parts) {
      let next = cursor.children.get(part)

      if (!next) {
        next = { children: new Map() }
        cursor.children.set(part, next)
      }

      cursor = next
    }
  }

  return root
}

/**
 * Render a tree built by `buildSpecTree` into box-drawing lines. Entries at
 * each level are sorted alphabetically; directories get a trailing `/`.
 */
export const renderSpecTree = (node: SpecTreeNode, prefix = ''): string[] => {
  const lines: string[] = []
  const entries = Array.from(node.children.entries()).sort(([aName, aNode], [bName, bNode]) => {
    const aIsDir = aNode.children.size > 0
    const bIsDir = bNode.children.size > 0

    if (aIsDir !== bIsDir) {
      return aIsDir ? -1 : 1
    }

    return aName.localeCompare(bName)
  })

  entries.forEach(([name, child], index) => {
    const isLast = index === entries.length - 1
    const connector = isLast ? '└── ' : '├── '
    const isDir = child.children.size > 0
    const label = isDir ? `${name}/` : name

    lines.push(`${prefix}${connector}${label}`)

    if (isDir) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ')

      lines.push(...renderSpecTree(child, childPrefix))
    }
  })

  return lines
}

const printJson = (obj: any): void => {
  logger.always(JSON.stringify(obj, null, 2))
}

/**
 * POST a GraphQL query to the instance's token-gated `/__inspect/graphql` mount.
 *
 * Uses the global `fetch` (Node ≥ 20.1). Origin header is omitted by default,
 * which is what non-browser contexts do and what the server-side allowlist
 * accepts.
 *
 * - Non-2xx response → throws.
 * - GraphQL `errors` in body → throws with the first error message.
 */
const postGraphQL = async (instance: Instance, query: string, variables?: any): Promise<any> => {
  const url = `http://127.0.0.1:${instance.port}/__inspect/graphql`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Cypress-Inspect-Token': instance.token,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request to ${url} failed with status ${response.status}`)
  }

  const body: any = await response.json()

  if (body && Array.isArray(body.errors) && body.errors.length > 0) {
    const first = body.errors[0]

    throw new Error(typeof first?.message === 'string' ? first.message : 'GraphQL error')
  }

  return body.data
}

const snapshotQuery = `
  query CypressInspectSnapshot {
    inspectSnapshot {
      pid
      cypressVersion
      projectRoot
      testingType
      browserStatus
      activeBrowser {
        name
        displayName
        channel
        family
        version
      }
      appRoute
      activeRun {
        specPath
        startedAt
        endedAt
        status
      }
      specCount
    }
  }
`

const specsQuery = `
  query CypressInspectSpecs {
    currentProject {
      specs {
        relative
        absolute
        specType
      }
    }
  }
`

const projectSpecsQuery = `
  query CypressInspectProjectSpecs {
    currentProject {
      projectRoot
      specs {
        relative
        absolute
      }
    }
  }
`

const runSpecMutation = `
  mutation CypressInspectRunSpec($specPath: String!) {
    runSpec(specPath: $specPath) {
      ... on RunSpecResponse {
        testingType
        browser {
          name
          displayName
          channel
          family
          version
        }
        spec {
          relative
          absolute
          name
        }
      }
      ... on RunSpecError {
        code
        detailMessage
      }
    }
  }
`

const switchRelaunchMutation = `
  mutation CypressInspectSwitchRelaunch($testingType: TestingTypeEnum!) {
    switchTestingTypeAndRelaunch(testingType: $testingType)
  }
`

const switchNoRelaunchMutation = `
  mutation CypressInspectSetTestingType($testingType: TestingTypeEnum!) {
    setAndLoadCurrentTestingType(testingType: $testingType) {
      __typename
    }
  }
`

const browsersQuery = `
  query CypressInspectBrowsers {
    currentProject {
      browsers {
        name
        channel
        family
        displayName
        version
        majorVersion
        isSelected
        disabled
        warning
      }
    }
  }
`

const setBrowserMutation = `
  mutation CypressInspectSetBrowser($id: ID!) {
    launchpadSetBrowser(id: $id) {
      __typename
    }
  }
`

const launchProjectMutation = `
  mutation CypressInspectLaunchProject {
    launchOpenProject {
      __typename
    }
  }
`

const closeBrowserMutation = `
  mutation CypressInspectCloseBrowser {
    closeBrowser
  }
`

const projectsQuery = `
  query CypressInspectProjects {
    projects {
      projectRoot
      title
    }
  }
`

const setCurrentProjectMutation = `
  mutation CypressInspectSetCurrentProject($path: String!) {
    setCurrentProject(path: $path) {
      __typename
    }
  }
`

const addProjectMutation = `
  mutation CypressInspectAddProject($path: String, $open: Boolean) {
    addProject(path: $path, open: $open) {
      __typename
    }
  }
`

const clearCurrentProjectMutation = `
  mutation CypressInspectClearCurrentProject {
    clearCurrentProject {
      __typename
    }
  }
`

const fetchSnapshot = async (instance: Instance): Promise<InspectSnapshot> => {
  const data = await postGraphQL(instance, snapshotQuery)

  return data.inspectSnapshot
}

/**
 * Strip fields that must never leave the host process (token) or leak
 * filesystem internals the caller shouldn't depend on (descriptorPath).
 */
const stripInstance = (instance: Instance): Omit<Instance, 'token' | 'descriptorPath'> => {
  const { token: _token, descriptorPath: _descriptorPath, ...rest } = instance

  return rest
}

/**
 * `cypress inspect list` — list all running instances.
 *
 * Exit 2 when there are none (unless `--json`, where the empty array is the
 * success signal). For text output, enriches each row with MODE/BROWSER via a
 * per-instance `inspectSnapshot` query. If an individual snapshot errors, that
 * row degrades to dashes rather than aborting the entire listing.
 */
const list = async (opts: InspectOpts): Promise<void> => {
  const instances = await readInstances()

  if (instances.length === 0) {
    if (opts.json) {
      printJson([])
      process.exit(0)

      return
    }

    writeStderr('No running Cypress instances.\n')
    process.exit(2)

    return
  }

  // Fetch snapshots concurrently; a single failure shouldn't take down the
  // whole list — per-row dashes communicate that one instance was unreachable.
  const snapshots = await Promise.all(instances.map(async (instance) => {
    try {
      return await fetchSnapshot(instance)
    } catch (_err) {
      return null
    }
  }))

  if (opts.json) {
    const rows = instances.map((instance, i) => {
      return {
        ...stripInstance(instance),
        snapshot: snapshots[i],
      }
    })

    printJson(rows)
    process.exit(0)

    return
  }

  const table = new Table({
    head: [
      chalk.white('PID'),
      chalk.white('PORT'),
      chalk.white('PROJECT'),
      chalk.white('MODE'),
      chalk.white('BROWSER'),
    ],
  })

  instances.forEach((instance, i) => {
    const snapshot = snapshots[i]
    let mode = '—'
    let browser = '—'

    if (snapshot) {
      mode = snapshot.testingType || '—'

      if (snapshot.activeBrowser?.name) {
        const status = snapshot.browserStatus ? ` (${snapshot.browserStatus})` : ''

        browser = `${snapshot.activeBrowser.name}${status}`
      }
    }

    table.push([
      String(instance.pid),
      String(instance.port),
      instance.projectRoot || '—',
      mode,
      browser,
    ])
  })

  logger.always(table.toString())
}

const writeResolveErrorAndExit = (err: any): void => {
  if (err.code === 'AMBIGUOUS_INSTANCE') {
    writeStderr('Multiple instances running. Pass --instance <pid>:\n')

    for (const instance of (err.instances || [])) {
      writeStderr(`  ${instance.pid}  ${instance.projectRoot || ''}\n`)
    }
  } else {
    writeStderr(`${err.message}\n`)
  }

  process.exit(2)
}

/**
 * Resolves the target instance or writes a stderr message + exits 2.
 *
 * Returns `null` (rather than throwing) when a known discovery error is
 * handled so the caller can short-circuit without relying on `process.exit`
 * having been stubbed in tests.
 */
const resolveOrExit = async (selector?: string): Promise<Instance | null> => {
  try {
    return await resolveInstance(selector)
  } catch (err: any) {
    if (err && (err.code === 'NO_INSTANCE' || err.code === 'AMBIGUOUS_INSTANCE')) {
      writeResolveErrorAndExit(err)

      return null
    }

    throw err
  }
}

/**
 * `cypress inspect status` — print the active instance's snapshot.
 */
const status = async (opts: InspectOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const snapshot = await fetchSnapshot(instance)

  if (opts.json) {
    printJson(snapshot)
    process.exit(0)

    return
  }

  const dash = '—'
  const projectRoot = snapshot.projectRoot || dash
  const testingType = snapshot.testingType || dash
  let browser = dash

  if (snapshot.activeBrowser?.name) {
    const statusText = snapshot.browserStatus ? ` (${snapshot.browserStatus})` : ''

    browser = `${snapshot.activeBrowser.name}${statusText}`
  }

  let activeRun = dash

  if (snapshot.activeRun) {
    const { specPath, status } = snapshot.activeRun
    const basename = specPath ? path.basename(specPath) : '<unknown>'

    activeRun = `${basename} (${status})`
  }

  logger.always(`Project:        ${projectRoot}`)
  logger.always(`Testing type:   ${testingType}`)
  logger.always(`Browser:        ${browser}`)
  logger.always(`App route:      ${snapshot.appRoute}`)
  logger.always(`Specs:          ${snapshot.specCount}`)
  logger.always(`Active run:     ${activeRun}`)
}

/**
 * `cypress inspect specs` — list specs for the active project. Exits 1 if no
 * project is loaded (there's nothing to list yet).
 */
const specs = async (opts: InspectOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const data = await postGraphQL(instance, specsQuery)

  if (!data.currentProject) {
    writeStderr('No project loaded\n')
    process.exit(1)

    return
  }

  const specList: SpecFields[] = data.currentProject.specs || []

  if (opts.json) {
    printJson(specList)
    process.exit(0)

    return
  }

  if (!specList.length) {
    return
  }

  const tree = buildSpecTree(specList.map((spec) => spec.relative))

  for (const line of renderSpecTree(tree)) {
    logger.always(line)
  }
}

interface ResolvedSpec {
  relative: string
  absolute: string
}

/**
 * Resolve a user-supplied spec string against the project's spec list.
 *
 * Resolution precedence (per design doc §9 Q4):
 *   1. Absolute path → exact match against `specs[].absolute`.
 *   2. Contains `/`  → resolved relative to `projectRoot`, then matched against
 *      `specs[].absolute`.
 *   3. Bare basename → match any spec whose `relative` equals the input or
 *      ends with `/<input>`. 0 matches → error; >1 → ambiguous error.
 *
 * Returns the matched spec on success; returns `null` after writing a message
 * to stderr and calling `process.exit(1)` on any failure so that callers can
 * short-circuit without relying on `process.exit` throwing.
 */
const resolveSpec = (
  specArg: string,
  projectRoot: string,
  specs: ResolvedSpec[],
): ResolvedSpec | null => {
  if (path.isAbsolute(specArg)) {
    const match = specs.find((s) => s.absolute === specArg)

    if (!match) {
      writeStderr(`No such spec: ${specArg}\n`)
      process.exit(1)

      return null
    }

    return match
  }

  if (specArg.includes('/')) {
    const absolute = path.resolve(projectRoot, specArg)
    const match = specs.find((s) => s.absolute === absolute)

    if (!match) {
      writeStderr(`No such spec: ${specArg}\n`)
      process.exit(1)

      return null
    }

    return match
  }

  // Bare basename: match `relative === specArg` or `relative` ends with `/specArg`.
  const basenameMatches = specs.filter((s) => {
    return s.relative === specArg || s.relative.endsWith(`/${specArg}`)
  })

  if (basenameMatches.length === 0) {
    writeStderr(`No spec matching: ${specArg}\n`)
    process.exit(1)

    return null
  }

  if (basenameMatches.length > 1) {
    writeStderr(`Ambiguous spec '${specArg}'. Matches:\n`)
    for (const match of basenameMatches) {
      writeStderr(`  ${match.relative}\n`)
    }

    process.exit(1)

    return null
  }

  return basenameMatches[0]
}

/**
 * `cypress inspect run <spec>` — launch a spec in the running instance.
 *
 * By default this is fire-and-forget: the `runSpec` mutation initiates the
 * run and the CLI returns once the mutation resolves. Pass `--wait` to poll
 * `inspectSnapshot.activeRun` until the run finishes.
 *
 * Exit codes under `--wait`:
 *   - 0   finished
 *   - 1   unexpected error (no activeRun record, etc.)
 *   - 124 timed out before the run finished
 *
 * Note: pass/fail counts are not reported — Cypress's driver runs Mocha
 * without the Base reporter, so `runner.stats` is never populated. Inspect
 * the Cypress UI (or `cypress run`) for test results.
 */
const run = async (opts: RunOpts): Promise<void> => {
  if (!opts.spec) {
    writeStderr('Missing required argument: <spec>. See `cypress inspect --help`.\n')
    process.exit(1)

    return
  }

  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const data = await postGraphQL(instance, projectSpecsQuery)

  if (!data.currentProject) {
    writeStderr('No project loaded\n')
    process.exit(1)

    return
  }

  const projectRoot: string = data.currentProject.projectRoot
  const specs: ResolvedSpec[] = data.currentProject.specs || []

  const resolved = resolveSpec(opts.spec, projectRoot, specs)

  if (!resolved) {
    return
  }

  const result = await postGraphQL(instance, runSpecMutation, { specPath: resolved.absolute })

  if (!opts.wait) {
    if (opts.json) {
      printJson(result.runSpec)

      return
    }

    logger.always(`Launched ${resolved.relative}`)

    return
  }

  // --wait: poll activeRun until status leaves starting/running.
  const finalSnapshot = await waitForActiveRun(instance, resolved.absolute, opts.timeout)

  if (opts.json) {
    printJson(finalSnapshot.activeRun)

    return
  }

  const activeRun = finalSnapshot.activeRun

  if (!activeRun) {
    writeStderr('Run ended without an activeRun record.\n')
    process.exit(1)

    return
  }

  logger.always(`${resolved.relative}: finished`)
}

/**
 * Poll `inspectSnapshot.activeRun` until it reaches `finished` for the spec
 * we just launched, or until the deadline expires.
 *
 * Behavior around edge cases:
 * - A stale `finished` record for a *different* spec is ignored — we only
 *   consider an activeRun terminal when its `specPath` matches the spec we
 *   launched. This avoids racing against a previous run's residue.
 * - `activeRun === null` on the first few polls is tolerated: `runSpec` sets
 *   `status: 'starting'` synchronously, but a slow disk / slow process could
 *   cause us to observe null briefly — treat it as "still starting" until
 *   the deadline.
 * - Times out with exit code 124; the caller keeps the CLI's exit semantics
 *   aligned with standard timeout utilities.
 */
const waitForActiveRun = async (
  instance: Instance,
  targetSpecPath: string,
  timeoutMs: number | undefined,
): Promise<InspectSnapshot> => {
  const effectiveTimeout = typeof timeoutMs === 'number' ? timeoutMs : 120000
  const deadline = Date.now() + effectiveTimeout
  const pollIntervalMs = 500

  let timer: ReturnType<typeof setTimeout> | null = null

  try {
    while (true) {
      await new Promise<void>((resolve) => {
        timer = setTimeout(resolve, pollIntervalMs)
      })

      timer = null

      const snapshot = await fetchSnapshot(instance)
      const active = snapshot.activeRun

      if (
        active &&
        active.specPath === targetSpecPath &&
        active.status === 'finished'
      ) {
        return snapshot
      }

      if (Date.now() >= deadline) {
        writeStderr(`Timed out after ${effectiveTimeout}ms waiting for run to finish.\n`)
        process.exit(124)

        // Unreachable; process.exit throws above. Return a placeholder to
        // satisfy TypeScript's control-flow analysis.
        return snapshot
      }
    }
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

/**
 * `cypress inspect switch <e2e|component>` — swap the active testing type.
 *
 * Default path calls `switchTestingTypeAndRelaunch` and polls
 * `inspectSnapshot.browserStatus` until it settles at `open` or `closed`.
 * `--no-relaunch` short-circuits to `setAndLoadCurrentTestingType`, which
 * just updates state without touching the browser.
 */
const switchMode = async (opts: SwitchOpts): Promise<void> => {
  if (!opts.mode) {
    writeStderr('Missing required argument: <mode>. See `cypress inspect --help`.\n')
    process.exit(1)

    return
  }

  if (opts.mode !== 'e2e' && opts.mode !== 'component') {
    writeStderr(`Invalid testing type '${opts.mode}'. Expected 'e2e' or 'component'.\n`)
    process.exit(1)

    return
  }

  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const testingType = opts.mode

  if (opts.noRelaunch) {
    await postGraphQL(instance, switchNoRelaunchMutation, { testingType })

    if (opts.json) {
      const snapshot = await fetchSnapshot(instance)

      printJson(snapshot)

      return
    }

    logger.always(`switched testing type to ${testingType}`)

    return
  }

  // Kick off the relaunch. The mutation returns synchronously but the browser
  // transitions (`opening` → `open` / `closing` → `closed`) land shortly after.
  await postGraphQL(instance, switchRelaunchMutation, { testingType })

  const timeoutMs = typeof opts.timeout === 'number' ? opts.timeout : 30000
  const pollIntervalMs = 500

  /**
   * Consider the switch complete when `browserStatus` has settled at `open`
   * or `closed` AND `testingType` matches the requested mode. If the server
   * has no browser queued at all (e.g. user hasn't picked one yet), a
   * settled `closed` + matching testingType is also a valid terminal state.
   *
   * Design note: we unconditionally wait at least one poll cycle so callers
   * don't race past the transition when the starting state already matches
   * the target. The polling loop below handles this naturally because the
   * first snapshot fetch happens after `pollIntervalMs`.
   */
  const isSettled = (snapshot: InspectSnapshot): boolean => {
    const statusSettled = snapshot.browserStatus === 'open' || snapshot.browserStatus === 'closed' || snapshot.browserStatus === null
    const typeMatches = snapshot.testingType === testingType

    return statusSettled && typeMatches
  }

  const deadline = Date.now() + timeoutMs
  let finalSnapshot: InspectSnapshot | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  try {
    while (true) {
      await new Promise<void>((resolve) => {
        timer = setTimeout(resolve, pollIntervalMs)
      })

      timer = null

      const snapshot = await fetchSnapshot(instance)

      if (isSettled(snapshot)) {
        finalSnapshot = snapshot
        break
      }

      if (Date.now() >= deadline) {
        writeStderr(`Timed out after ${timeoutMs}ms waiting for testing type switch.\n`)
        process.exit(124)

        return
      }
    }
  } finally {
    // Clear any pending poll timer on error/exit paths.
    if (timer) {
      clearTimeout(timer)
    }
  }

  if (!finalSnapshot) {
    return
  }

  if (opts.json) {
    printJson(finalSnapshot)

    return
  }

  let browserLine = '—'

  if (finalSnapshot.activeBrowser?.name) {
    const statusText = finalSnapshot.browserStatus ? ` (${finalSnapshot.browserStatus})` : ''

    browserLine = `${finalSnapshot.activeBrowser.name}${statusText}`
  }

  logger.always(`switched testing type to ${testingType}`)
  logger.always(`browser: ${browserLine}`)
}

interface BrowserFields {
  name: string
  channel: string
  family: string
  displayName: string
  version: string
  majorVersion: string | null
  isSelected: boolean
  disabled?: boolean | null
  warning?: string | null
}

/**
 * Shared id derivation — mirrors `BrowserDataSource.idForBrowser`. Kept in
 * sync with the server so the CLI can pass an id to `launchpadSetBrowser`
 * without a second round-trip to fetch the GraphQL node id.
 */
const idForBrowser = (b: Pick<BrowserFields, 'name' | 'family' | 'channel'>): string => {
  return `${b.name}-${b.family}-${b.channel}`
}

/**
 * Produce the Relay-style global node id the `launchpadSetBrowser` mutation
 * expects (`ctx.fromId(id, 'Browser')` in `DataContext.ts`). Mirrors the
 * server's `makeId('Browser', idForBrowser(b))` — base64 of `Browser:<id>`.
 */
const nodeIdForBrowser = (b: Pick<BrowserFields, 'name' | 'family' | 'channel'>): string => {
  return Buffer.from(`Browser:${idForBrowser(b)}`).toString('base64')
}

const fetchBrowsers = async (instance: Instance): Promise<BrowserFields[]> => {
  const data = await postGraphQL(instance, browsersQuery)

  if (!data.currentProject) {
    writeStderr('No project loaded\n')
    process.exit(1)
  }

  return data.currentProject.browsers || []
}

/**
 * Pick a browser out of the list by user-supplied selector.
 *
 * Accepted forms:
 *   - `chrome`           → first matching name, preferring `stable` channel
 *   - `chrome:beta`      → exact name + channel
 *   - `chrome-chromium-stable` → exact id (as derived by `idForBrowser`)
 *
 * Disabled browsers are excluded — picking one would immediately fail the
 * launch, and the `warning` field is the server's signal that it's
 * unusable in this project.
 */
const matchBrowser = (browsers: BrowserFields[], selector: string): BrowserFields | null => {
  const usable = browsers.filter((b) => !b.disabled)

  const byId = usable.find((b) => idForBrowser(b) === selector)

  if (byId) return byId

  const [name, channel] = selector.split(':')

  const matches = usable.filter((b) => b.name === name)

  if (!matches.length) return null

  if (channel) {
    return matches.find((b) => b.channel === channel) || null
  }

  return matches.find((b) => b.channel === 'stable') || matches[0]
}

const printBrowsersText = (browsers: BrowserFields[]): void => {
  if (!browsers.length) {
    logger.always('No compatible browsers detected.')

    return
  }

  const table = new Table({
    head: [
      chalk.white(''),
      chalk.white('NAME'),
      chalk.white('CHANNEL'),
      chalk.white('VERSION'),
      chalk.white('DISPLAY NAME'),
    ],
  })

  for (const browser of browsers) {
    const marker = browser.isSelected ? chalk.green('●') : ' '
    const name = browser.disabled ? chalk.dim(browser.name) : browser.name

    table.push([marker, name, browser.channel, browser.version, browser.displayName])
  }

  logger.always(table.toString())
}

/**
 * `cypress inspect browser list` — print compatible browsers for the active
 * project. The row marked with `●` is the currently-active browser
 * (`activeBrowser`), which is what `browser open` without arguments will
 * launch.
 */
const browserList = async (opts: InspectOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const browsers = await fetchBrowsers(instance)

  if (opts.json) {
    printJson(browsers)
    process.exit(0)

    return
  }

  printBrowsersText(browsers)
}

/**
 * `cypress inspect browser open [name]` — launch the browser.
 *
 * If `name` is omitted, the instance's existing `activeBrowser` is used —
 * Cypress already picks a default on project load (CLI flag →
 * `cypress.config.defaultBrowser` → last-used → first-found), so running
 * this with no args in a fresh `cypress open` session Just Works.
 *
 * Exit codes:
 *   - 0   browser is open (already or after launch)
 *   - 1   no testing type set, no browser resolvable, or launch errored
 *   - 124 timed out waiting for `browserStatus` to reach `open`
 */
const browserOpen = async (opts: BrowserOpenOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const snapshot = await fetchSnapshot(instance)

  if (!snapshot.projectRoot) {
    writeStderr('No project loaded\n')
    process.exit(1)

    return
  }

  // A browser launch is bound to a testingType — `launchProject` will throw
  // without one. Fail fast with a useful message rather than letting the
  // mutation bubble up a generic GraphQL error.
  if (!snapshot.testingType) {
    writeStderr('No testing type selected. Run `cypress inspect switch <e2e|component>` first.\n')
    process.exit(1)

    return
  }

  let target: BrowserFields | null = null

  if (opts.name) {
    const browsers = await fetchBrowsers(instance)

    target = matchBrowser(browsers, opts.name)

    if (!target) {
      writeStderr(`No compatible browser matching '${opts.name}'. Run \`cypress inspect browser list\` to see available browsers.\n`)
      process.exit(1)

      return
    }

    // Only flip the active browser if it's different from what's set — this
    // lets `launchpadSetBrowser` remain a no-op when the user re-asks for
    // the browser that's already the default.
    const current = snapshot.activeBrowser
    const targetId = idForBrowser(target)
    const currentId = current ? idForBrowser(current as any) : null

    if (targetId !== currentId) {
      await postGraphQL(instance, setBrowserMutation, { id: nodeIdForBrowser(target) })
    }
  } else if (!snapshot.activeBrowser) {
    writeStderr('No default browser is set. Pass a browser name — run `cypress inspect browser list` to see available browsers.\n')
    process.exit(1)

    return
  } else {
    // Use the instance's current default (set on boot by
    // `setInitialActiveBrowser`). Printed later via a post-launch snapshot.
  }

  // Idempotent short-circuit: if the browser is already open and we didn't
  // switch to a different one, there's nothing to do.
  if (snapshot.browserStatus === 'open' && !opts.name) {
    if (opts.json) {
      printJson(snapshot)

      return
    }

    const browser = snapshot.activeBrowser?.name ?? 'browser'

    logger.always(`${browser} is already open`)

    return
  }

  await postGraphQL(instance, launchProjectMutation)

  const timeoutMs = typeof opts.timeout === 'number' ? opts.timeout : 30000
  const pollIntervalMs = 500
  const deadline = Date.now() + timeoutMs

  let finalSnapshot: InspectSnapshot | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  try {
    while (true) {
      await new Promise<void>((resolve) => {
        timer = setTimeout(resolve, pollIntervalMs)
      })

      timer = null

      const next = await fetchSnapshot(instance)

      if (next.browserStatus === 'open') {
        finalSnapshot = next
        break
      }

      if (Date.now() >= deadline) {
        writeStderr(`Timed out after ${timeoutMs}ms waiting for browser to open.\n`)
        process.exit(124)

        return
      }
    }
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }

  if (!finalSnapshot) {
    return
  }

  if (opts.json) {
    printJson(finalSnapshot)

    return
  }

  const browserName = finalSnapshot.activeBrowser?.name ?? 'browser'

  logger.always(`${browserName} (open)`)
}

/**
 * `cypress inspect browser close` — close the currently-open browser.
 *
 * Idempotent: if `browserStatus` is already `closed` (or `null` — the
 * pre-picker state), this is a no-op. Otherwise calls the `closeBrowser`
 * mutation and polls until `browserStatus` settles at `closed`.
 *
 * Exit codes:
 *   - 0   browser is closed (already or after the mutation)
 *   - 1   no instance resolvable, or an unexpected error bubbled up
 *   - 124 timed out waiting for `browserStatus` to reach `closed`
 */
const browserClose = async (opts: BrowserCloseOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const snapshot = await fetchSnapshot(instance)

  // `null` here means no browser has ever been opened in this instance yet
  // (e.g. still on the launchpad browser picker). Treat it the same as a
  // settled `closed` — there's nothing to do and firing the mutation would
  // just be wasted GraphQL.
  if (snapshot.browserStatus === 'closed' || snapshot.browserStatus === null) {
    if (opts.json) {
      printJson(snapshot)

      return
    }

    logger.always('browser is already closed')

    return
  }

  await postGraphQL(instance, closeBrowserMutation)

  const timeoutMs = typeof opts.timeout === 'number' ? opts.timeout : 30000
  const pollIntervalMs = 500
  const deadline = Date.now() + timeoutMs

  let finalSnapshot: InspectSnapshot | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  try {
    while (true) {
      await new Promise<void>((resolve) => {
        timer = setTimeout(resolve, pollIntervalMs)
      })

      timer = null

      const next = await fetchSnapshot(instance)

      if (next.browserStatus === 'closed' || next.browserStatus === null) {
        finalSnapshot = next
        break
      }

      if (Date.now() >= deadline) {
        writeStderr(`Timed out after ${timeoutMs}ms waiting for browser to close.\n`)
        process.exit(124)

        return
      }
    }
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }

  if (!finalSnapshot) {
    return
  }

  if (opts.json) {
    printJson(finalSnapshot)

    return
  }

  logger.always('browser closed')
}

interface ProjectLike {
  projectRoot: string
  title: string
}

const fetchProjects = async (instance: Instance): Promise<ProjectLike[]> => {
  const data = await postGraphQL(instance, projectsQuery)

  return data.projects || []
}

/**
 * Resolve a user-supplied selector into an absolute project path.
 *
 * Order of attempts:
 *   1. Absolute path → use as-is.
 *   2. Path relative to the CLI's cwd → resolve.
 *   3. Substring match against the instance's recents list (`projectRoot`).
 *
 * Path forms (1) and (2) are returned even when the path isn't in recents —
 * the caller falls back to `addProject` in that case so a brand-new project
 * can be opened in one step. Substring matching (3) is strict: if the
 * selector resolves to a real filesystem path AND matches multiple recents,
 * the filesystem resolution wins (the user's intent is unambiguous); only
 * when the path doesn't exist do we ambiguity-check the recents list.
 *
 * Returns `{ path, inRecents }` or `null` when nothing plausible matched.
 */
const resolveProject = (
  selector: string,
  projects: ProjectLike[],
): { path: string, inRecents: boolean } | { error: string, candidates?: ProjectLike[] } | null => {
  const asAbs = path.isAbsolute(selector) ? selector : path.resolve(process.cwd(), selector)

  // Check recents first by exact match on the absolute form.
  const exact = projects.find((p) => p.projectRoot === asAbs)

  if (exact) return { path: exact.projectRoot, inRecents: true }

  // Substring fallback — only matters when the selector isn't already an
  // existing path. Prefer this over a filesystem check so a bare `my-app`
  // selector can resolve to a recents entry under `/Users/me/code/my-app`.
  const substrMatches = projects.filter((p) => p.projectRoot.includes(selector))

  if (substrMatches.length === 1) {
    return { path: substrMatches[0].projectRoot, inRecents: true }
  }

  if (substrMatches.length > 1) {
    return { error: `Multiple recent projects matched '${selector}'`, candidates: substrMatches }
  }

  // No recents match — fall back to treating the selector as a filesystem
  // path. The server's `addProject` / `setCurrentProject` will surface an
  // error if the path doesn't actually hold a Cypress project.
  return { path: asAbs, inRecents: false }
}

/**
 * `cypress inspect project list` — list projects in the instance's recents,
 * marking the one currently loaded.
 */
const projectList = async (opts: InspectOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const [projects, snapshot] = await Promise.all([
    fetchProjects(instance),
    fetchSnapshot(instance),
  ])

  if (opts.json) {
    printJson(projects.map((p) => ({
      ...p,
      current: p.projectRoot === snapshot.projectRoot,
    })))

    process.exit(0)

    return
  }

  if (!projects.length) {
    logger.always('No recent projects.')

    return
  }

  const table = new Table({
    head: [
      chalk.white(''),
      chalk.white('PROJECT'),
      chalk.white('TITLE'),
    ],
  })

  for (const project of projects) {
    const marker = project.projectRoot === snapshot.projectRoot ? chalk.green('●') : ' '

    table.push([marker, project.projectRoot, project.title])
  }

  logger.always(table.toString())
}

/**
 * Poll `inspectSnapshot.projectRoot` until it matches `target` (or null,
 * when the caller is waiting for `clearCurrentProject`). Shared between
 * `project open` and `project clear`.
 */
const waitForProjectRoot = async (
  instance: Instance,
  target: string | null,
  timeoutMs: number,
  description: string,
): Promise<InspectSnapshot> => {
  const pollIntervalMs = 500
  const deadline = Date.now() + timeoutMs

  let timer: ReturnType<typeof setTimeout> | null = null

  try {
    while (true) {
      await new Promise<void>((resolve) => {
        timer = setTimeout(resolve, pollIntervalMs)
      })

      timer = null

      const snapshot = await fetchSnapshot(instance)

      if (snapshot.projectRoot === target) {
        return snapshot
      }

      if (Date.now() >= deadline) {
        writeStderr(`Timed out after ${timeoutMs}ms waiting for ${description}.\n`)
        process.exit(124)

        return snapshot
      }
    }
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

/**
 * `cypress inspect project open <path>` — load a project into the instance.
 *
 * If the resolved path is already in the recents list, calls
 * `setCurrentProject`. Otherwise falls back to `addProject({ open: true })`
 * so a brand-new project can be opened in one shot.
 *
 * Short-circuits when the target is already the current project.
 */
const projectOpen = async (opts: ProjectPathOpts): Promise<void> => {
  if (!opts.path) {
    writeStderr('Missing required argument: <path>. See `cypress inspect --help`.\n')
    process.exit(1)

    return
  }

  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const [projects, snapshot] = await Promise.all([
    fetchProjects(instance),
    fetchSnapshot(instance),
  ])

  const resolved = resolveProject(opts.path, projects)

  if (!resolved) {
    writeStderr(`Could not resolve '${opts.path}' to a project.\n`)
    process.exit(1)

    return
  }

  if ('error' in resolved) {
    writeStderr(`${resolved.error}:\n`)
    for (const p of resolved.candidates ?? []) {
      writeStderr(`  ${p.projectRoot}\n`)
    }

    process.exit(1)

    return
  }

  // Idempotent short-circuit — if the requested project is already loaded,
  // there's nothing to do and firing the mutation would reset wizard state.
  if (resolved.path === snapshot.projectRoot) {
    if (opts.json) {
      printJson(snapshot)

      return
    }

    logger.always(`${resolved.path} is already the current project`)

    return
  }

  if (resolved.inRecents) {
    await postGraphQL(instance, setCurrentProjectMutation, { path: resolved.path })
  } else {
    await postGraphQL(instance, addProjectMutation, { path: resolved.path, open: true })
  }

  const timeoutMs = typeof opts.timeout === 'number' ? opts.timeout : 30000
  const finalSnapshot = await waitForProjectRoot(instance, resolved.path, timeoutMs, 'project to load')

  if (opts.json) {
    printJson(finalSnapshot)

    return
  }

  logger.always(`opened ${resolved.path}`)

  // Selecting a new project resets the launchpad wizard; surface the next
  // step so a one-shot "open and run" workflow doesn't hit a cryptic error
  // from `inspect run` when testingType is null.
  if (!finalSnapshot.testingType) {
    logger.always('Testing type not selected. Run `cypress inspect switch <e2e|component>` to pick one.')
  }
}

/**
 * `cypress inspect project add <path>` — add a project to the instance's
 * recents without switching to it. Mirrors the launchpad "add project"
 * affordance; for an add-and-switch workflow use `project open <path>`
 * instead.
 */
const projectAdd = async (opts: ProjectPathOpts): Promise<void> => {
  if (!opts.path) {
    writeStderr('Missing required argument: <path>. See `cypress inspect --help`.\n')
    process.exit(1)

    return
  }

  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  // Resolve to an absolute path so recents entries are canonical. We don't
  // check against existing recents here — a second `addProject` is a no-op
  // server-side, and failing on "already there" would be more annoying
  // than useful for scripts.
  const abs = path.isAbsolute(opts.path) ? opts.path : path.resolve(process.cwd(), opts.path)

  await postGraphQL(instance, addProjectMutation, { path: abs, open: false })

  if (opts.json) {
    const projects = await fetchProjects(instance)

    printJson(projects)

    return
  }

  logger.always(`added ${abs}`)
}

/**
 * `cypress inspect project clear` — unload the current project, returning
 * the instance to the launchpad project picker.
 *
 * Idempotent when no project is loaded.
 */
const projectClear = async (opts: ProjectClearOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const snapshot = await fetchSnapshot(instance)

  if (!snapshot.projectRoot) {
    if (opts.json) {
      printJson(snapshot)

      return
    }

    logger.always('no project is currently loaded')

    return
  }

  await postGraphQL(instance, clearCurrentProjectMutation)

  const timeoutMs = typeof opts.timeout === 'number' ? opts.timeout : 30000
  const finalSnapshot = await waitForProjectRoot(instance, null, timeoutMs, 'project to clear')

  if (opts.json) {
    printJson(finalSnapshot)

    return
  }

  logger.always('project cleared')
}

const inspectModule = {
  list,
  status,
  specs,
  run,
  switch: switchMode,
  browserList,
  browserOpen,
  browserClose,
  projectList,
  projectOpen,
  projectAdd,
  projectClear,
}

export default inspectModule
