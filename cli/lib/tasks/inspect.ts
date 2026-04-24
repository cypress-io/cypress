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
 * Options for `cypress inspect spec open <name>`.
 *
 * Opening a spec launches it (there is no separate `run` step). By default
 * the command returns once the launch is initiated; `--wait` blocks until
 * the run finishes so CI scripts can use the exit code.
 *
 * - `name` is the spec selector (basename, relative path, or absolute path).
 * - `wait` (`--wait`) polls `inspectSnapshot.activeRun` until the run leaves
 *   the `starting` / `running` states. Exits 0 on pass, 1 on fail, 124 on timeout.
 * - `timeout` (`--timeout <ms>`) overrides the default wait deadline. Only
 *   meaningful together with `--wait`.
 */
interface SpecOpenOpts extends InspectOpts {
  name?: string
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
 * Options for `cypress inspect test open <selector>`.
 *
 * - `selector` is the positional arg. Resolution precedence:
 *   1. Exact `testId` match (e.g. `r3`)
 *   2. Exact joined title-path match (e.g. `"Suite > test one"`)
 *   3. Unique substring match against the joined title path
 */
interface TestOpenOpts extends InspectOpts {
  selector?: string
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
  studioActiveTestId: string | null
}

interface ActiveRun {
  specPath: string
  startedAt: string
  endedAt: string | null
  status: 'starting' | 'running' | 'finished'
  tests: TestResult[]
  stats: TestStats
  commands: CommandLog[]
}

interface CommandLog {
  id: string
  name: string
  message: string
  state: 'pending' | 'passed' | 'failed' | 'warn'
  type: string
  testId: string | null
  displayName: string | null
  number: number | null
  snapshotCount: number
  hasSnapshot: boolean
  hasConsoleProps: boolean
  timeout: number | null
  numElements: number | null
  visible: boolean | null
  groupLevel: number | null
  group: number | null
  alias: string | null
  aliasType: string | null
  referencesAlias: string[] | null
  hookId: string | null
  error: string | null
  wallClockStartedAt: string | null
  attemptIndex: number
  attemptState: string
}

interface PinnedCommand {
  testId: string
  logId: string
  command: CommandLog
  consolePropsJson: string | null
}

/**
 * Options for `cypress inspect command pin <selector>`.
 *
 * - `selector` resolves in this precedence:
 *   1. Exact log id match (e.g. `'log-primary-7'`)
 *   2. Exact `number` match (1-based ordinal, e.g. `'3'`)
 *   3. Unique substring match against command `name` (e.g. `'visit'`)
 */
interface CommandPinOpts extends InspectOpts {
  selector?: string
}

/**
 * Options for `cypress inspect command info <selector...>`.
 *
 * - `selectors` is 1..N positional selectors. Each resolves independently using
 *   the same precedence as `command pin` (id → number → unique name substring).
 * - Read-only: does NOT pin any command in the reporter UI.
 */
interface CommandInfoOpts extends InspectOpts {
  selectors?: string[]
}

interface TestResult {
  testId: string
  title: string
  titlePath: string[]
  state: 'passed' | 'failed' | 'pending' | 'skipped'
  duration: number | null
  currentRetry: number
  error: string | null
}

interface TestStats {
  passed: number
  failed: number
  pending: number
  skipped: number
  total: number
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

// Force stdout into blocking mode the first time we print JSON. Node.js
// pipes are non-blocking by default, so a large payload followed by an
// immediate `process.exit()` can be truncated at the pipe buffer (~64KB).
// Blocking mode guarantees the full write drains before the process dies.
let stdoutSetBlocking = false
const printJson = (obj: any): void => {
  if (!stdoutSetBlocking) {
    const handle = (process.stdout as any)._handle

    if (handle && typeof handle.setBlocking === 'function') {
      handle.setBlocking(true)
    }

    stdoutSetBlocking = true
  }

  logger.always(JSON.stringify(obj))
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
        tests {
          testId
          title
          titlePath
          state
          duration
          currentRetry
          error
        }
        stats {
          passed
          failed
          pending
          skipped
          total
        }
        commands {
          id
          name
          message
          state
          type
          testId
          displayName
          number
          snapshotCount
          hasSnapshot
          hasConsoleProps
          timeout
          numElements
          visible
          groupLevel
          group
          alias
          aliasType
          referencesAlias
          hookId
          error
          wallClockStartedAt
          attemptIndex
          attemptState
        }
      }
      specCount
      studioActiveTestId
    }
  }
`

const pinnedCommandQuery = `
  query CypressInspectPinnedCommand {
    inspectSnapshot {
      studioActiveTestId
      pinnedCommand {
        testId
        logId
        consolePropsJson
        command {
          id
          name
          message
          state
          type
          testId
          displayName
          number
          snapshotCount
          hasSnapshot
          hasConsoleProps
          timeout
          numElements
          visible
          groupLevel
          group
          alias
          aliasType
          referencesAlias
          hookId
          error
          wallClockStartedAt
          attemptIndex
          attemptState
        }
      }
    }
  }
`

const inspectCommandInfoQuery = `
  query CypressInspectCommandInfo($logIds: [String!]!) {
    inspectCommandInfo(logIds: $logIds) {
      ... on InspectCommandInfoResponse {
        items {
          consolePropsJson
          command {
            id
            name
            message
            state
            type
            testId
            displayName
            number
            snapshotCount
            hasSnapshot
            hasConsoleProps
            timeout
            numElements
            visible
            groupLevel
            group
            alias
            aliasType
            referencesAlias
            hookId
            error
            wallClockStartedAt
            attemptIndex
            attemptState
          }
        }
      }
      ... on InspectCommandInfoError {
        code
        detailMessage
      }
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

const studioInitTestMutation = `
  mutation CypressInspectStudioInitTest($testId: ID!) {
    studioInitTest(testId: $testId) {
      ... on StudioInitResponse {
        testId
      }
      ... on StudioInitError {
        code
        detailMessage
      }
    }
  }
`

const studioCancelMutation = `
  mutation CypressInspectStudioCancel {
    studioCancel
  }
`

const autInspectQuery = `
  query CypressInspectAut {
    autInspect {
      ... on AutInspectResponse {
        url
        title
        viewportWidth
        viewportHeight
      }
      ... on AutInspectError {
        code
        detailMessage
      }
    }
  }
`

const autInspectDomQuery = `
  query CypressInspectAutDom($selector: String!) {
    autInspectDom(selector: $selector) {
      ... on AutInspectDomResponse {
        selector
        count
        matches {
          tag
          text
          attrs {
            name
            value
          }
          outerHTML
        }
      }
      ... on AutInspectError {
        code
        detailMessage
      }
    }
  }
`

// GraphQL has no native recursive queries, so we spell out children up to
// depth 10 via a repeated fragment. Real a11y trees are rarely deeper than
// 6; anything beyond 10 will have its children silently dropped from the CLI
// response (the runner still returns them, we just don't select past 10).
const AUT_A11Y_NODE_FIELDS = `
  fragment NodeFields on AutInspectA11yNode {
    role name level value checked disabled selector
  }
`

const buildNestedChildren = (depth: number): string => {
  if (depth <= 0) return ''

  return `children { ...NodeFields ${buildNestedChildren(depth - 1)} }`
}

const autInspectSnapshotQuery = `
  ${AUT_A11Y_NODE_FIELDS}
  query CypressInspectAutSnapshot {
    autInspectSnapshot {
      ... on AutInspectSnapshotResponse {
        url
        title
        viewportWidth
        viewportHeight
        nodeCount
        truncated
        tree {
          ...NodeFields
          ${buildNestedChildren(10)}
        }
      }
      ... on AutInspectError {
        code
        detailMessage
      }
    }
  }
`

const inspectPinCommandMutation = `
  mutation CypressInspectPinCommand($logId: String!) {
    inspectPinCommand(logId: $logId) {
      ... on InspectPinCommandResponse {
        logId
      }
      ... on InspectPinCommandError {
        code
        detailMessage
      }
    }
  }
`

const inspectUnpinCommandMutation = `
  mutation CypressInspectUnpinCommand {
    inspectUnpinCommand
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
 * `cypress inspect spec list` — list specs for the active project. Exits 1
 * if no project is loaded (there's nothing to list yet).
 */
const specList = async (opts: InspectOpts): Promise<void> => {
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

  const list: SpecFields[] = data.currentProject.specs || []

  if (opts.json) {
    printJson(list)
    process.exit(0)

    return
  }

  if (!list.length) {
    return
  }

  const tree = buildSpecTree(list.map((spec) => spec.relative))

  for (const line of renderSpecTree(tree)) {
    logger.always(line)
  }
}

/**
 * `cypress inspect spec` — report metadata about the currently-loaded spec.
 *
 * "Current" is defined as `inspectSnapshot.activeRun.specPath` — in the new
 * model, setting a spec launches it, so the active run's spec is the one
 * the user is currently working with. If no spec has been launched since
 * the instance started, prints a message and exits 0 (not an error state —
 * "no spec loaded" is a valid answer).
 */
const specCurrent = async (opts: InspectOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const snapshot = await fetchSnapshot(instance)
  const activeRun = snapshot.activeRun

  if (!activeRun) {
    if (opts.json) {
      printJson(null)

      return
    }

    logger.always('No spec is currently loaded.')

    return
  }

  if (opts.json) {
    printJson(activeRun)

    return
  }

  const basename = path.basename(activeRun.specPath)
  const { stats } = activeRun

  logger.always(`Spec:     ${basename}`)
  logger.always(`Path:     ${activeRun.specPath}`)
  logger.always(`Status:   ${activeRun.status}`)
  logger.always(
    `Tests:    ${stats.passed} passed, ${stats.failed} failed, ${stats.pending} pending, ${stats.skipped} skipped (${stats.total} total)`,
  )

  if (activeRun.tests.length) {
    logger.always('')
    for (const test of activeRun.tests) {
      const title = test.titlePath.length ? test.titlePath.join(' > ') : test.title

      logger.always(`  [${test.state}] ${title}`)
    }
  }
}

/**
 * `cypress inspect test` (bare) — only meaningful when Studio is active.
 *
 * Returns the high-level status of the targeted test plus the command log
 * entries for it (what the reporter shows in the left bar). Errors when no
 * Studio session is active so the CLI clearly signals the precondition.
 */
const testCurrent = async (opts: InspectOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const snapshot = await fetchSnapshot(instance)

  if (!snapshot.studioActiveTestId) {
    writeStderr('Not in Studio mode. Run `cypress inspect test open <selector>` first.\n')
    process.exit(1)

    return
  }

  const activeRun = snapshot.activeRun

  if (!activeRun) {
    writeStderr('Studio is active but no spec is loaded — inconsistent state.\n')
    process.exit(1)

    return
  }

  const testId = snapshot.studioActiveTestId
  const test = activeRun.tests.find((t) => t.testId === testId)
  const commands = activeRun.commands

  if (opts.json) {
    printJson({ test: test ?? null, commands })

    return
  }

  if (test) {
    const title = test.titlePath.length ? test.titlePath.join(' > ') : test.title
    const duration = typeof test.duration === 'number' ? `${test.duration}ms` : '—'

    logger.always(`Test:     ${title}`)
    logger.always(`Id:       ${test.testId}`)
    logger.always(`State:    ${test.state}`)
    logger.always(`Duration: ${duration}`)

    if (test.error) {
      logger.always('')
      logger.always(chalk.red(`Error: ${test.error}`))
    }
  } else {
    // Studio can activate before a test finishes its first attempt — in that
    // case `activeRun.tests` won't have the entry yet, but we still have the
    // testId and (likely) in-flight commands.
    logger.always(`Test:     (awaiting first attempt)`)
    logger.always(`Id:       ${testId}`)
  }

  logger.always('')
  logger.always(`Commands (${commands.length}):`)

  if (!commands.length) {
    logger.always('  (none yet — commands stream in as the test runs)')

    return
  }

  const colorAttempt = (state: string): string => {
    if (state === 'passed') return chalk.green(state)

    if (state === 'failed') return chalk.red(state)

    if (state === 'pending') return chalk.yellow(state)

    return chalk.dim(state)
  }

  let lastAttempt: number | null = null
  const uniqueAttempts = new Set(commands.map((c) => c.attemptIndex))
  const showAttemptHeaders = uniqueAttempts.size > 1

  for (const cmd of commands) {
    if (showAttemptHeaders && cmd.attemptIndex !== lastAttempt) {
      if (lastAttempt !== null) logger.always('')

      logger.always(`  ${chalk.dim(`Attempt ${cmd.attemptIndex} [${colorAttempt(cmd.attemptState)}]`)}`)
      lastAttempt = cmd.attemptIndex
    }

    const state = (() => {
      if (cmd.state === 'passed') return chalk.green(cmd.state)

      if (cmd.state === 'failed') return chalk.red(cmd.state)

      if (cmd.state === 'warn') return chalk.yellow(cmd.state)

      return chalk.dim(cmd.state)
    })()

    const num = cmd.number ? chalk.dim(`${cmd.number}.`.padStart(4, ' ')) : '    '
    const name = cmd.displayName || cmd.name
    const suffix = cmd.message ? ` ${chalk.dim(cmd.message)}` : ''

    logger.always(`  ${num} [${state}] ${name}${suffix}`)
  }
}

/**
 * `cypress inspect test list` — list tests for the currently-loaded spec
 * along with their status and any per-test info that's been surfaced so far.
 *
 * Data source is `inspectSnapshot.activeRun.tests`, which the driver populates
 * via the `test:result` socket event as the run progresses. Early in a run
 * this list may be empty or partial — that's expected, not an error. If no
 * spec has been loaded at all, exits 1 with an error message (you need a
 * spec open to list its tests).
 */
const testList = async (opts: InspectOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const snapshot = await fetchSnapshot(instance)
  const activeRun = snapshot.activeRun

  if (!activeRun) {
    writeStderr('No spec is currently loaded. Run `cypress inspect spec open <name>` first.\n')
    process.exit(1)

    return
  }

  const tests = activeRun.tests

  if (opts.json) {
    printJson(tests)

    return
  }

  if (!tests.length) {
    // `activeRun` exists but no test results yet — the run is still spinning
    // up or hasn't emitted any `test:result` events. Tell the user rather
    // than printing silence that looks like an empty spec.
    logger.always(`${path.basename(activeRun.specPath)} (${activeRun.status}): no test results yet`)

    return
  }

  const table = new Table({
    head: [
      chalk.white('STATE'),
      chalk.white('TITLE'),
      chalk.white('DURATION'),
      chalk.white('RETRY'),
    ],
  })

  const colorState = (state: TestResult['state']): string => {
    if (state === 'passed') return chalk.green(state)

    if (state === 'failed') return chalk.red(state)

    if (state === 'pending' || state === 'skipped') return chalk.yellow(state)

    return state
  }

  for (const test of tests) {
    const title = test.titlePath.length ? test.titlePath.join(' > ') : test.title
    const duration = typeof test.duration === 'number' ? `${test.duration}ms` : '—'
    const retry = test.currentRetry > 0 ? String(test.currentRetry) : ''

    table.push([colorState(test.state), title, duration, retry])
  }

  logger.always(table.toString())

  // Surface error messages below the table — they won't fit in a column
  // without wrapping ugly, and they're the information that matters most
  // when something failed.
  const failures = tests.filter((t) => t.state === 'failed' && t.error)

  if (failures.length) {
    logger.always('')
    for (const failure of failures) {
      const title = failure.titlePath.length ? failure.titlePath.join(' > ') : failure.title

      logger.always(chalk.red(`FAIL ${title}`))
      logger.always(`  ${failure.error}`)
    }
  }
}

/**
 * Resolve a user-supplied test selector against `activeRun.tests`.
 *
 * Precedence:
 *   1. Exact `testId` match (`r3`)
 *   2. Exact joined title-path match (`"Suite > test one"`)
 *   3. Unique substring match against the joined title path
 *
 * Writes to stderr + exits 1 on failure (no match / ambiguous).
 */
const resolveTest = (selector: string, tests: TestResult[]): TestResult | null => {
  const byId = tests.find((t) => t.testId === selector)

  if (byId) return byId

  const joined = (t: TestResult) => (t.titlePath.length ? t.titlePath.join(' > ') : t.title)

  const byExactTitle = tests.find((t) => joined(t) === selector)

  if (byExactTitle) return byExactTitle

  const substringMatches = tests.filter((t) => joined(t).includes(selector))

  if (substringMatches.length === 0) {
    writeStderr(`No test matching: ${selector}\n`)
    process.exit(1)

    return null
  }

  if (substringMatches.length > 1) {
    writeStderr(`Ambiguous test '${selector}'. Matches:\n`)
    for (const match of substringMatches) {
      writeStderr(`  [${match.testId}] ${joined(match)}\n`)
    }

    process.exit(1)

    return null
  }

  return substringMatches[0]
}

/**
 * `cypress inspect test open <selector>` — remotely trigger the equivalent of
 * clicking "Edit in Studio" on a test row in the reporter.
 *
 * Resolves the selector against `activeRun.tests` locally so we can emit a
 * precise "no match / ambiguous" error instead of relying on the server to
 * enumerate candidates. Then fires the `studioInitTest` mutation, which pushes
 * a `studio:remote-init:test` socket event to the runner — the browser's
 * EventManager runs the same handler the button click uses.
 *
 * Exits silently with code 0 on success ("fire and see what we get").
 */
const testOpen = async (opts: TestOpenOpts): Promise<void> => {
  if (!opts.selector) {
    writeStderr('Missing required argument: <selector>. See `cypress inspect --help`.\n')
    process.exit(1)

    return
  }

  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const snapshot = await fetchSnapshot(instance)
  const activeRun = snapshot.activeRun

  if (!activeRun) {
    writeStderr('No spec is currently loaded. Run `cypress inspect spec open <name>` first.\n')
    process.exit(1)

    return
  }

  const resolved = resolveTest(opts.selector, activeRun.tests)

  if (!resolved) {
    return
  }

  const data = await postGraphQL(instance, studioInitTestMutation, { testId: resolved.testId })
  const result = data.studioInitTest

  if (result.code) {
    // Server-side validation rejected it — surface the detail message.
    writeStderr(`${result.code}: ${result.detailMessage}\n`)
    process.exit(1)

    return
  }

  if (opts.json) {
    printJson(result)
  }
}

/**
 * `cypress inspect test close` — deactivate Studio. Equivalent to clicking
 * the cancel button in the Studio panel: tears down the server-side
 * `StudioLifecycleManager` and clears the browser's studio store state.
 *
 * Idempotent from the caller's perspective — the mutation always resolves
 * to `true`. Firing it when Studio isn't active is a no-op on the browser
 * side (the handler guards on store state internally).
 */
const testClose = async (opts: InspectOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  await postGraphQL(instance, studioCancelMutation)
}

/**
 * Resolve a user-supplied command selector against the Studio test's command
 * log. Precedence mirrors `resolveTest`:
 *   1. Exact log id match (e.g. `'log-primary-7'`) — resolved across ALL
 *      attempts, since log ids are globally unique per session.
 *   2. Exact `number` match (1-based ordinal, stringified) — scoped to the
 *      latest attempt, since `number` resets per attempt.
 *   3. Unique substring match against `name` — scoped to the latest attempt
 *      for the same reason. Cross-attempt lookups should use the log id.
 *
 * Writes to stderr + exits 1 on miss / ambiguous.
 */
const resolveCommand = (selector: string, commands: CommandLog[]): CommandLog | null => {
  const byId = commands.find((c) => c.id === selector)

  if (byId) return byId

  const latestAttempt = commands.reduce((max, c) => Math.max(max, c.attemptIndex), 0)
  const latestCommands = commands.filter((c) => c.attemptIndex === latestAttempt)

  const numeric = Number(selector)

  if (Number.isFinite(numeric)) {
    const byNumber = latestCommands.find((c) => c.number === numeric)

    if (byNumber) return byNumber
  }

  const substringMatches = latestCommands.filter((c) => c.name.includes(selector))

  if (substringMatches.length === 0) {
    writeStderr(`No command matching: ${selector}\n`)
    process.exit(1)

    return null
  }

  if (substringMatches.length > 1) {
    writeStderr(`Ambiguous command '${selector}'. Matches:\n`)
    for (const match of substringMatches) {
      const numLabel = match.number != null ? `#${match.number}` : '   '
      const msg = match.message ? ` ${match.message}` : ''

      writeStderr(`  [${match.id}] ${numLabel} ${match.name}${msg}\n`)
    }

    process.exit(1)

    return null
  }

  return substringMatches[0]
}

/**
 * Require Studio to be active for the `command` family. Writes a hint to
 * stderr and exits 1 when no test is open in Studio; otherwise returns the
 * snapshot so callers can proceed.
 */
const requireStudioSnapshot = async (instance: Instance): Promise<InspectSnapshot | null> => {
  const snapshot = await fetchSnapshot(instance)

  if (!snapshot.studioActiveTestId) {
    writeStderr('Not in Studio mode. Run `cypress inspect test open <selector>` first.\n')
    process.exit(1)

    return null
  }

  return snapshot
}

/**
 * `cypress inspect command list` — enumerate commands for the Studio-active
 * test, with richer metadata than `inspect test` shows (snapshot count,
 * duration, element count, alias, hook context, etc.).
 *
 * Studio keeps every attempt of a retried test, so commands are grouped by
 * attempt (0-indexed). The latest attempt is always shown last; within an
 * attempt, commands are ordered as they fired.
 *
 * `--json` returns the raw `activeRun.commands` array for downstream scripts.
 * Each entry carries `attemptIndex` / `attemptState` so scripts can filter
 * without parsing the pretty output.
 */
const commandList = async (opts: InspectOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const snapshot = await requireStudioSnapshot(instance)

  if (!snapshot) {
    return
  }

  const commands = snapshot.activeRun?.commands ?? []

  if (opts.json) {
    printJson(commands)

    return
  }

  if (!commands.length) {
    logger.always('(no commands — run the test or wait for commands to stream in)')

    return
  }

  const colorCommandState = (state: CommandLog['state']): string => {
    if (state === 'passed') return chalk.green(state)

    if (state === 'failed') return chalk.red(state)

    if (state === 'warn') return chalk.yellow(state)

    return chalk.dim(state)
  }

  const colorAttemptState = (state: string): string => {
    if (state === 'passed') return chalk.green(state)

    if (state === 'failed') return chalk.red(state)

    if (state === 'pending') return chalk.yellow(state)

    return chalk.dim(state)
  }

  // Group commands by attempt. Preserve attempt-index order so the final
  // attempt prints last.
  const attempts = new Map<number, { state: string, commands: CommandLog[] }>()

  for (const cmd of commands) {
    let bucket = attempts.get(cmd.attemptIndex)

    if (!bucket) {
      bucket = { state: cmd.attemptState, commands: [] }
      attempts.set(cmd.attemptIndex, bucket)
    }

    bucket.commands.push(cmd)
  }

  const attemptIndexes = Array.from(attempts.keys()).sort((a, b) => a - b)
  const hasMultipleAttempts = attemptIndexes.length > 1

  attemptIndexes.forEach((attemptIndex, i) => {
    const { state, commands: attemptCommands } = attempts.get(attemptIndex)!

    if (hasMultipleAttempts) {
      if (i > 0) logger.always('')

      logger.always(`Attempt ${attemptIndex} [${colorAttemptState(state)}]`)
    }

    const table = new Table({
      head: [
        chalk.white('#'),
        chalk.white('STATE'),
        chalk.white('NAME'),
        chalk.white('MESSAGE'),
        chalk.white('SNAPS'),
        chalk.white('ELEMS'),
        chalk.white('ALIAS'),
      ],
    })

    for (const cmd of attemptCommands) {
      const number = cmd.number != null ? String(cmd.number) : ''
      const name = cmd.displayName || cmd.name
      const elems = cmd.numElements != null ? String(cmd.numElements) : ''
      const alias = cmd.alias ?? ''

      table.push([number, colorCommandState(cmd.state), name, cmd.message, String(cmd.snapshotCount), elems, alias])
    }

    logger.always(table.toString())
  })
}

/**
 * `cypress inspect command` (bare) — show rich detail for the currently
 * pinned command: all `CommandLog` metadata plus `consoleProps`. Errors if
 * no command is pinned (run `inspect command pin <selector>` first).
 */
const commandCurrent = async (opts: InspectOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const data = await postGraphQL(instance, pinnedCommandQuery)
  const pinned: PinnedCommand | null = data.inspectSnapshot?.pinnedCommand ?? null
  const studioActiveTestId: string | null = data.inspectSnapshot?.studioActiveTestId ?? null

  if (!studioActiveTestId) {
    writeStderr('Not in Studio mode. Run `cypress inspect test open <selector>` first.\n')
    process.exit(1)

    return
  }

  if (!pinned) {
    if (opts.json) {
      printJson(null)

      return
    }

    writeStderr('No command is pinned. Run `cypress inspect command pin <selector>` first.\n')
    process.exit(1)

    return
  }

  if (opts.json) {
    printJson(pinned)

    return
  }

  printCommandDetail(pinned.command, pinned.consolePropsJson)
}

/**
 * Pretty-print a single `CommandLog` entry plus its `consoleProps` dump to
 * stdout. Shared by `command` (bare) and `command info <selector...>`.
 */
const printCommandDetail = (cmd: CommandLog, consolePropsJson: string | null): void => {
  const numLabel = cmd.number != null ? `#${cmd.number}` : ''
  const name = cmd.displayName || cmd.name

  logger.always(`Command:   ${name} ${chalk.dim(numLabel)}`)
  logger.always(`Id:        ${cmd.id}`)
  logger.always(`State:     ${cmd.state}`)
  logger.always(`Type:      ${cmd.type}`)
  logger.always(`Attempt:   ${cmd.attemptIndex}${cmd.attemptState ? chalk.dim(` (${cmd.attemptState})`) : ''}`)

  if (cmd.message) logger.always(`Message:   ${cmd.message}`)

  if (cmd.alias) logger.always(`Alias:     ${cmd.alias}${cmd.aliasType ? chalk.dim(` (${cmd.aliasType})`) : ''}`)

  if (cmd.referencesAlias?.length) logger.always(`References: ${cmd.referencesAlias.join(', ')}`)

  if (cmd.numElements != null) logger.always(`Elements:  ${cmd.numElements}`)

  if (cmd.visible != null) logger.always(`Visible:   ${cmd.visible}`)

  if (cmd.timeout != null) logger.always(`Timeout:   ${cmd.timeout}ms`)

  logger.always(`Snapshots: ${cmd.snapshotCount}`)
  if (cmd.hookId) logger.always(`Hook:      ${cmd.hookId}`)

  if (cmd.groupLevel != null && cmd.groupLevel > 0) logger.always(`Group:     level ${cmd.groupLevel}${cmd.group != null ? ` (parent ${cmd.group})` : ''}`)

  if (cmd.wallClockStartedAt) logger.always(`Started:   ${cmd.wallClockStartedAt}`)

  if (cmd.error) {
    logger.always('')
    logger.always(chalk.red(`Error: ${cmd.error}`))
  }

  if (consolePropsJson) {
    logger.always('')
    logger.always('Console props:')

    try {
      const parsed = JSON.parse(consolePropsJson)

      logger.always(JSON.stringify(parsed, null, 2))
    } catch {
      logger.always(consolePropsJson)
    }
  }
}

/**
 * `cypress inspect command pin <selector>` — remotely pin a command in the
 * reporter. Selector resolves locally (exact id → number → unique name
 * substring) before calling `inspectPinCommand`.
 *
 * Exits silently with code 0 on success.
 */
const commandPin = async (opts: CommandPinOpts): Promise<void> => {
  if (!opts.selector) {
    writeStderr('Missing required argument: <selector>. See `cypress inspect --help`.\n')
    process.exit(1)

    return
  }

  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const snapshot = await requireStudioSnapshot(instance)

  if (!snapshot) {
    return
  }

  const commands = snapshot.activeRun?.commands ?? []

  if (!commands.length) {
    writeStderr('No commands on the current Studio test.\n')
    process.exit(1)

    return
  }

  const resolved = resolveCommand(opts.selector, commands)

  if (!resolved) {
    return
  }

  const data = await postGraphQL(instance, inspectPinCommandMutation, { logId: resolved.id })
  const result = data.inspectPinCommand

  if (result.code) {
    writeStderr(`${result.code}: ${result.detailMessage}\n`)
    process.exit(1)

    return
  }

  if (opts.json) {
    printJson(result)
  }
}

/**
 * `cypress inspect command unpin` — unpin whatever command is currently pinned
 * in the reporter. Idempotent.
 */
const commandUnpin = async (opts: InspectOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  await postGraphQL(instance, inspectUnpinCommandMutation)
}

/**
 * `cypress inspect command info <selector...>` — read-only detail for one or
 * more commands. Selectors resolve locally (same precedence as `command pin`:
 * id → number → unique name substring). Duplicate resolutions are de-duped in
 * response order. Does NOT pin anything in the reporter UI.
 *
 * Output:
 * - text: `printCommandDetail` per item, separated by a rule line
 * - JSON: always an array of `{ command, consolePropsJson }`, even for N=1
 */
const commandInfo = async (opts: CommandInfoOpts): Promise<void> => {
  const selectors = opts.selectors ?? []

  if (selectors.length === 0) {
    writeStderr('Missing required argument: <selector>. See `cypress inspect --help`.\n')
    process.exit(1)

    return
  }

  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const snapshot = await requireStudioSnapshot(instance)

  if (!snapshot) {
    return
  }

  const commands = snapshot.activeRun?.commands ?? []

  if (!commands.length) {
    writeStderr('No commands on the current Studio test.\n')
    process.exit(1)

    return
  }

  // Resolve each selector; bail on the first miss/ambiguous. `resolveCommand`
  // calls process.exit(1) itself, so null returns don't reach this loop —
  // the explicit break is defensive.
  const resolvedIds: string[] = []
  const seen = new Set<string>()

  for (const selector of selectors) {
    const resolved = resolveCommand(selector, commands)

    if (!resolved) {
      return
    }

    if (!seen.has(resolved.id)) {
      seen.add(resolved.id)
      resolvedIds.push(resolved.id)
    }
  }

  const data = await postGraphQL(instance, inspectCommandInfoQuery, { logIds: resolvedIds })
  const result = data.inspectCommandInfo

  if (result.code) {
    writeStderr(`${result.code}: ${result.detailMessage}\n`)
    process.exit(1)

    return
  }

  const items: Array<{ command: CommandLog, consolePropsJson: string | null }> = result.items ?? []

  if (opts.json) {
    printJson(items)

    return
  }

  items.forEach((item, i) => {
    if (i > 0) {
      logger.always('')
      logger.always(chalk.dim('──'))
      logger.always('')
    }

    printCommandDetail(item.command, item.consolePropsJson)
  })
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
 * `cypress inspect spec open <name>` — load a spec into the running instance,
 * which launches it (opening the spec is running it).
 *
 * By default this is fire-and-forget: the `runSpec` mutation initiates the
 * run and the CLI returns once the mutation resolves. Pass `--wait` to poll
 * `inspectSnapshot.activeRun` until the run finishes.
 *
 * Exit codes under `--wait`:
 *   - 0   finished with no failures
 *   - 1   unexpected error (no activeRun record, etc.) or one or more failing tests
 *   - 124 timed out before the run finished
 *
 * Per-test outcomes are bridged from the driver over the `test:result` socket
 * event and surfaced as `activeRun.tests` / `activeRun.stats`. Retries
 * overwrite the prior attempt server-side so the final state wins.
 */
const specOpen = async (opts: SpecOpenOpts): Promise<void> => {
  if (!opts.name) {
    writeStderr('Missing required argument: <name>. See `cypress inspect --help`.\n')
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

  const resolved = resolveSpec(opts.name, projectRoot, specs)

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

  const { stats } = activeRun

  logger.always(`${resolved.relative}: finished`)
  logger.always(
    `  ${stats.passed} passed, ${stats.failed} failed, ${stats.pending} pending, ${stats.skipped} skipped (${stats.total} total)`,
  )

  if (stats.failed > 0) {
    for (const test of activeRun.tests) {
      if (test.state !== 'failed') continue

      const path = test.titlePath.length ? test.titlePath.join(' > ') : test.title

      writeStderr(`  FAIL ${path}${test.error ? `\n      ${test.error}` : ''}\n`)
    }

    process.exit(1)
  }
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
    printJson(projects.map((p) => {
      return {
        ...p,
        current: p.projectRoot === snapshot.projectRoot,
      }
    }))

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

interface AutDomOpts extends InspectOpts {
  selector?: string
}

const AUT_ERROR_HINT: Record<string, string> = {
  NOT_IN_STUDIO: 'Not in Studio mode. Run `cypress inspect test open <selector>` first.',
  TIMEOUT: 'AUT did not respond in time. Make sure the runner is open and the test is paused in Studio.',
  AUT_UNAVAILABLE: 'The AUT iframe is not ready (no document loaded, or cross-origin and inaccessible).',
  INVALID_SELECTOR: 'The CSS selector was rejected by the browser parser.',
}

const writeAutError = (code: string, detailMessage?: string): void => {
  const hint = AUT_ERROR_HINT[code] || code
  const detail = detailMessage ? ` (${detailMessage})` : ''

  writeStderr(`${code}: ${hint}${detail}\n`)
}

/**
 * `cypress inspect aut` — snapshot of the AUT iframe: URL, title, and
 * viewport dimensions. Studio-gated: requires `inspect test open <selector>`
 * to have been run first (otherwise exits 1 with `NOT_IN_STUDIO`).
 */
const aut = async (opts: InspectOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const data = await postGraphQL(instance, autInspectQuery)
  const result = data.autInspect

  if (result.code) {
    writeAutError(result.code, result.detailMessage)
    process.exit(1)

    return
  }

  if (opts.json) {
    printJson(result)

    return
  }

  logger.always(`URL:      ${result.url}`)
  logger.always(`Title:    ${result.title ?? chalk.dim('(unavailable — cross-origin)')}`)
  logger.always(`Viewport: ${result.viewportWidth}x${result.viewportHeight}`)
}

/**
 * `cypress inspect aut dom <selector>` — CSS selector query against the AUT
 * DOM. Returns up to 20 matches with tag/attrs/truncated text/outerHTML.
 * Truncation is applied by the runner, not the CLI. Studio-gated.
 */
const autDom = async (opts: AutDomOpts): Promise<void> => {
  if (!opts.selector) {
    writeStderr('Missing required argument: <selector>. See `cypress inspect --help`.\n')
    process.exit(1)

    return
  }

  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const data = await postGraphQL(instance, autInspectDomQuery, { selector: opts.selector })
  const result = data.autInspectDom

  if (result.code) {
    writeAutError(result.code, result.detailMessage)
    process.exit(1)

    return
  }

  if (opts.json) {
    printJson(result)

    return
  }

  logger.always(`Selector: ${result.selector}`)
  logger.always(`Count:    ${result.count}`)

  if (result.count === 0) {
    return
  }

  logger.always('')

  const capped = result.matches.length < result.count
    ? chalk.dim(` (showing first ${result.matches.length})`)
    : ''

  logger.always(`Matches${capped}:`)

  result.matches.forEach((m: any, i: number) => {
    const num = chalk.dim(`${i + 1}.`.padStart(4, ' '))
    const attrsPreview = m.attrs.length
      ? ` ${chalk.dim(m.attrs.map((a: any) => `${a.name}="${a.value}"`).join(' '))}`
      : ''
    const textPreview = m.text ? ` ${chalk.dim(JSON.stringify(m.text))}` : ''

    logger.always(`  ${num} [${m.tag}]${attrsPreview}${textPreview}`)
  })
}

interface A11yNode {
  role: string
  name: string | null
  level: number | null
  value: string | null
  checked: boolean | null
  disabled: boolean | null
  selector: string
  children?: A11yNode[]
}

const formatA11yNode = (n: A11yNode): string => {
  const bits: string[] = [`[${n.role}`]

  if (n.level != null) bits.push(`level=${n.level}`)

  bits[bits.length - 1] += ']'

  if (n.name) bits.push(chalk.white(JSON.stringify(n.name)))

  if (n.value != null) bits.push(chalk.dim(`value=${JSON.stringify(n.value)}`))

  if (n.checked != null) bits.push(chalk.dim(`checked=${n.checked}`))

  if (n.disabled) bits.push(chalk.dim('disabled'))

  bits.push(chalk.dim(`→ ${n.selector}`))

  return bits.join(' ')
}

const printA11yTree = (node: A11yNode, prefix: string, isLast: boolean, isRoot: boolean): void => {
  if (isRoot) {
    logger.always(formatA11yNode(node))
  } else {
    const connector = isLast ? '└─ ' : '├─ '

    logger.always(`${prefix}${connector}${formatA11yNode(node)}`)
  }

  const children = node.children || []
  const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ')

  children.forEach((child, i) => {
    printA11yTree(child, childPrefix, i === children.length - 1, false)
  })
}

/**
 * `cypress inspect aut snapshot` — compact accessibility tree of the AUT.
 * Each node carries a unique CSS selector that can be fed to
 * `cypress inspect aut dom <selector>` for deeper inspection. Studio-gated.
 */
const autSnapshot = async (opts: InspectOpts): Promise<void> => {
  const instance = await resolveOrExit(opts.instance)

  if (!instance) {
    return
  }

  const data = await postGraphQL(instance, autInspectSnapshotQuery)
  const result = data.autInspectSnapshot

  if (result.code) {
    writeAutError(result.code, result.detailMessage)
    process.exit(1)

    return
  }

  if (opts.json) {
    printJson(result)

    return
  }

  logger.always(`URL:      ${result.url}`)
  logger.always(`Title:    ${result.title ?? chalk.dim('(unavailable)')}`)
  logger.always(`Viewport: ${result.viewportWidth}x${result.viewportHeight}`)
  logger.always(`Nodes:    ${result.nodeCount}${result.truncated ? chalk.yellow(' (truncated at 500)') : ''}`)
  logger.always('')

  printA11yTree(result.tree, '', true, true)
}

const inspectModule = {
  list,
  status,
  specCurrent,
  specList,
  specOpen,
  testCurrent,
  testList,
  testOpen,
  testClose,
  commandList,
  commandCurrent,
  commandInfo,
  commandPin,
  commandUnpin,
  aut,
  autDom,
  autSnapshot,
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
