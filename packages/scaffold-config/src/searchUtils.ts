import findUp from 'find-up'
import path from 'path'
import fs from 'fs-extra'
import Debug from 'debug'
const debug = Debug('cypress:scaffold-config:searchUtils')

const ROOT_PATHS = [
  '.git',

  // https://pnpm.io/workspaces
  'pnpm-workspace.yaml',

  // https://rushjs.io/pages/advanced/config_files/
  'rush.json',

  // https://nx.dev/deprecated/workspace-json#workspace.json
  // https://nx.dev/reference/nx-json#nx.json
  'workspace.json',
  'nx.json',

  // https://lerna.js.org/docs/api-reference/configuration
  'lerna.json',
]

async function hasWorkspacePackageJson (directory: string) {
  try {
    const pkg = await fs.readJson(path.join(directory, 'package.json'))

    debug('package file for %s: %o', directory, pkg)

    return !!pkg.workspaces
  } catch (e) {
    debug('error reading package.json in %s. this is not the repository root', directory)

    return false
  }
}

export async function isRepositoryRoot (directory: string) {
  if (ROOT_PATHS.some((rootPath) => fs.existsSync(path.join(directory, rootPath)))) {
    return true
  }

  return hasWorkspacePackageJson(directory)
}

/**
 * Recursing search upwards from projectPath until the repository root looking for .pnp.cjs.
 * If `.pnp.cjs` is found, return it
 */
export async function tryToFindPnpFile (projectPath: string): Promise<string | undefined> {
  return findUp(async (directory: string) => {
    const isCurrentRepositoryRoot = await isRepositoryRoot(directory)

    const file = path.join(directory, '.pnp.cjs')
    const hasPnpCjs = await fs.pathExists(file)

    if (hasPnpCjs) {
      return file
    }

    if (isCurrentRepositoryRoot) {
      debug('stopping search at %s because it is believed to be the repository root', directory)

      return findUp.stop
    }

    // Return undefined to keep searching
    return undefined
  }, { cwd: projectPath })
}
