import { promisify } from 'util'
import { exec as origExec } from 'child_process'
import { promises as fs } from 'fs'
const exec = promisify(origExec)

import debug from 'debug'

const logInfo = debug('cypress:snapgen:info')
const logDebug = debug('cypress:snapgen:debug')
const logError = debug('cypress:snapgen:error')

type YarnTreeChild = {
  name: string
  color: 'dim' | 'bold'
  shadow: boolean
}

type YarnTree = {
  name: string
  children: YarnTreeChild[]
}

type YarnList = {
  type: 'tree'
  data: {
    type: 'list'
    trees: YarnTree[]
  }
}

type ExtractDependenciesOpts = { toplevelOnly: boolean }
const DEFAULT_EXTRACT_OPTS: ExtractDependenciesOpts = {
  toplevelOnly: false,
}

function depWithoutVersion (dep: string): string {
  const parts = dep.split('@')

  return parts.length > 2
    ? // @babel/code-frame@^7.10.4
    `@${ parts[0] }${parts[1]}`
    : // convert-source-map@^1.7.0
    parts[0]
}

/**
 * Extracts dependencies from a dep list obtained via `yarn`.
 */
export function extractDependencies (
  yarnList: YarnList,
  partial_opts?: Partial<ExtractDependenciesOpts>,
) {
  const opts = Object.assign({}, DEFAULT_EXTRACT_OPTS, partial_opts)

  const deps = yarnList.data.trees.reduce((acc: string[], x: YarnTree) => {
    acc.push(depWithoutVersion(x.name))
    if (!opts.toplevelOnly) {
      for (const childDep of x.children.map((x) => depWithoutVersion(x.name))) {
        acc.push(childDep)
      }
    }

    return acc
  }, [])

  return deps
}

type CreateSnapshotScriptOpts = ExtractDependenciesOpts
const DEFAULT_SNAPSHOT_SCRIPT_OPTS = Object.assign({}, DEFAULT_EXTRACT_OPTS)

/**
 * Creates a snapshot script from the provided list of deps obtained via `yarn`.
 */
export function createSnapshotScriptFromYarnScript (
  yarnList: YarnList,
  partial_opts?: Partial<CreateSnapshotScriptOpts>,
) {
  const opts = Object.assign({}, DEFAULT_SNAPSHOT_SCRIPT_OPTS, partial_opts)
  const deps = extractDependencies(yarnList, opts)

  return deps.map((x) => `exports['${x}'] = require('${x}')`).join('\n')
}

type GenerateSnapshotScriptOpts = CreateSnapshotScriptOpts & { prod: boolean }
const DEFAULT_GENERATE_SCRIPT_OPTS = Object.assign(
  {},
  DEFAULT_SNAPSHOT_SCRIPT_OPTS,
  { prod: true },
)

/**
 * An alternative to obtaining dependencies which uses `yarn` and generating
 * a snapshot entry file from them.
 * At this point it is not used.
 *
 * @param projectRoot root of the project whose dependencies we are collecting
 * @param fullPathToSnapshotEntry path to the file to which to write the
 * snapshot entry
 * @param partial_opts
 */
export async function generateSnapshotEntryFromYarnList (
  projectRoot: string,
  fullPathToSnapshotEntry: string,
  partial_opts?: Partial<GenerateSnapshotScriptOpts>,
) {
  const opts: GenerateSnapshotScriptOpts = Object.assign(
    {},
    DEFAULT_GENERATE_SCRIPT_OPTS,
    partial_opts,
  )

  logInfo('Running yarn list')
  const args = ['list', '--json']

  if (opts.prod) {
    args.push('--prod')
  }

  const cmd = `yarn ${args.join(' ')}`

  logDebug('Running "%s"', cmd)
  try {
    const result = await exec(cmd, { cwd: projectRoot })
    const json = result.stdout
    const yarnList: YarnList = JSON.parse(json)
    const script = createSnapshotScriptFromYarnScript(yarnList, opts)

    logInfo(
      'Writing snapshot script (len: %s) to "%s"',
      script.length,
      fullPathToSnapshotEntry,
    )

    await fs.writeFile(fullPathToSnapshotEntry, script, 'utf8')
  } catch (err) {
    logError(err)
  }
}
