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
 */
interface RunOpts extends InspectOpts {
  spec?: string
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
  activeRun: null
  specCount: number
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

  const activeRun = snapshot.activeRun || dash

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
 * Fire-and-forget; the server-side `runSpec` mutation initiates the run but
 * does not wait for it to finish. `--wait` is explicitly deferred to Phase 2
 * (design doc §6) because it needs a new lifecycle signal.
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

  if (opts.json) {
    printJson(result.runSpec)

    return
  }

  logger.always(`Launched ${resolved.relative}`)
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

const inspectModule = {
  list,
  status,
  specs,
  run,
  switch: switchMode,
}

export default inspectModule
