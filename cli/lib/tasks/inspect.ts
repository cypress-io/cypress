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

const inspectModule = {
  list,
  status,
  specs,
}

export default inspectModule
