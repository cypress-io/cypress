import fs from 'fs-extra'
import path from 'path'
import execa from 'execa'
import { cyTmpDir, projectPath, projects, root } from '../fixtures'
import { getYarnCommand } from './yarn'
import { getNpmCommand } from './npm'

type Dependencies = Record<string, string>

/**
 * Type for package.json files for system-tests example projects.
 */
type SystemTestPkgJson = {
  /**
   * By default, scaffolding will run install if there is a `package.json`.
   * This option, if set, disables that.
   */
  _cySkipDepInstall?: boolean
  /**
   * Run the yarn v3-style install command instead of yarn v1-style.
   */
  _cyYarnV311?: boolean
  /**
   * By default, the automatic install will not run postinstall scripts. This
   * option, if set, will cause postinstall scripts to run for this project.
   */
  _cyRunScripts?: boolean
  dependencies?: Dependencies
  devDependencies?: Dependencies
  optionalDependencies?: Dependencies
}

const log = (...args) => console.log('📦', ...args)

/**
* Given a package name, returns the path to the module directory on disk.
*/
function pathToPackage (pkg: string): string {
  return path.dirname(require.resolve(`${pkg}/package.json`))
}

async function ensureCacheDir (cacheDir: string) {
  try {
    await fs.stat(cacheDir)
  } catch (err) {
    log(`Creating a new node_modules cache dir at ${cacheDir}`)
    await fs.mkdirp(cacheDir)
  }
}

/**
 * Symlink the cached `node_modules` directory to the temp project directory's `node_modules`.
 */
async function symlinkNodeModulesFromCache (tmpNodeModulesDir: string, cacheDir: string): Promise<void> {
  await fs.symlink(cacheDir, tmpNodeModulesDir, 'junction')

  log(`node_modules symlink created at ${tmpNodeModulesDir}`)
}

/**
 * Copy the cached `node_modules` to the temp project directory's `node_modules`.
 *
 * @returns a callback that will copy changed `node_modules` back to the cached `node_modules`.
 */
async function copyNodeModulesFromCache (tmpNodeModulesDir: string, cacheDir: string): Promise<() => Promise<void>> {
  await fs.copy(cacheDir, tmpNodeModulesDir, { dereference: true })

  log(`node_modules copied to ${tmpNodeModulesDir} from cache dir ${cacheDir}`)

  return async () => {
    try {
      await fs.copy(tmpNodeModulesDir, cacheDir, { dereference: true })
    } catch (err) {
      if (err.message === 'Source and destination must not be the same') return

      throw err
    }

    log(`node_modules copied from ${tmpNodeModulesDir} to cache dir ${cacheDir}`)
  }
}

async function getLockFilename (dir: string) {
  const hasYarnLock = !!await fs.stat(path.join(dir, 'yarn.lock')).catch(() => false)
  const hasNpmLock = !!await fs.stat(path.join(dir, 'package-lock.json')).catch(() => false)

  if (hasYarnLock && hasNpmLock) throw new Error(`The example project at '${dir}' has conflicting lockfiles. Only use one package manager's lockfile per project.`)

  if (hasNpmLock) return 'package-lock.json'

  // default to yarn
  return 'yarn.lock'
}

function getRelativePathToProjectDir (projectDir: string) {
  return path.relative(projectDir, path.join(root, '..'))
}

async function restoreLockFileRelativePaths (opts: { projectDir: string, lockFilePath: string, relativePathToMonorepoRoot: string }) {
  const relativePathToProjectDir = getRelativePathToProjectDir(opts.projectDir)
  const lockFileContents = (await fs.readFile(opts.lockFilePath, 'utf8'))
  .replaceAll(opts.relativePathToMonorepoRoot.replace(/\\+/g, '/'), relativePathToProjectDir.replace(/\\+/g, '/'))

  await fs.writeFile(opts.lockFilePath, lockFileContents)
}

async function normalizeLockFileRelativePaths (opts: { project: string, projectDir: string, lockFilePath: string, lockFilename: string, relativePathToMonorepoRoot: string }) {
  const relativePathToProjectDir = getRelativePathToProjectDir(opts.projectDir)
  const lockFileContents = (await fs.readFile(opts.lockFilePath, 'utf8'))
  .replaceAll(relativePathToProjectDir.replace(/\\+/g, '/'), opts.relativePathToMonorepoRoot.replace(/\\+/g, '/'))

  // write back to the original project dir, not the tmp copy
  await fs.writeFile(path.join(projects, opts.project, opts.lockFilename), lockFileContents)
}

/**
 * Given a path to a `package.json`, convert any references to development
 * versions of packages to absolute paths, so `yarn`/`npm` will not reach out to
 * the Internet to obtain these packages once it runs in the temp dir.
 * @returns a list of dependency names that were updated
 */
async function makeWorkspacePackagesAbsolute (pathToPkgJson: string): Promise<string[]> {
  const pkgJson = await fs.readJson(pathToPkgJson)
  const updatedDeps: string[] = []

  for (const deps of [pkgJson.dependencies, pkgJson.devDependencies, pkgJson.optionalDependencies]) {
    for (const dep in deps) {
      const version = deps[dep]

      if (version.startsWith('file:')) {
        const absPath = pathToPackage(dep)

        log(`Setting absolute path in package.json for ${dep}: ${absPath}.`)

        deps[dep] = `file:${absPath}`
        updatedDeps.push(dep)
      }
    }
  }

  await fs.writeJson(pathToPkgJson, pkgJson)

  return updatedDeps
}

/**
 * Given a `system-tests` project name, detect and install the `node_modules`
 * specified in the project's `package.json`. No-op if no `package.json` is found.
 * Will use `yarn` or `npm` based on the lockfile present.
 */
export async function scaffoldProjectNodeModules ({
  project,
  updateLockFile = !!process.env.UPDATE_LOCK_FILE,
  forceCopyDependencies = false,
}: {
  project: string
  updateLockFile?: boolean
  forceCopyDependencies?: boolean
}): Promise<void> {
  const projectDir = projectPath(project)
  const relativePathToMonorepoRoot = path.relative(
    path.join(projects, project),
    path.join(root, '..'),
  )
  const projectPkgJsonPath = path.join(projectDir, 'package.json')

  const runCmd = async (cmd) => {
    log(`Running "${cmd}" in ${projectDir}`)
    await execa(cmd, { cwd: projectDir, stdio: 'inherit', shell: true })
  }

  const cacheNodeModulesDir = path.join('/tmp', 'cy-system-tests-node-modules', project, 'node_modules')
  const tmpNodeModulesDir = path.join(projectPath(project), 'node_modules')

  async function removeWorkspacePackages (packages: string[]): Promise<void> {
    for (const dep of packages) {
      const depDir = path.join(tmpNodeModulesDir, dep)

      log('Removing', depDir)
      await fs.remove(depDir)
    }
  }

  try {
    // this will throw and exit early if the package.json does not exist
    const pkgJson: SystemTestPkgJson = require(projectPkgJsonPath)

    log(`Found package.json for project ${project}.`)

    if (pkgJson._cySkipDepInstall) {
      return log(`_cySkipDepInstall set in package.json, skipping dep-installer steps`)
    }

    if (!pkgJson.dependencies && !pkgJson.devDependencies && !pkgJson.optionalDependencies) {
      return log(`No dependencies found, skipping dep-installer steps`)
    }

    const lockFilename = await getLockFilename(projectDir)
    const hasYarnLock = lockFilename === 'yarn.lock'

    // 1. Ensure there is a cache directory set up for this test project's `node_modules`.
    await ensureCacheDir(cacheNodeModulesDir)

    let persistCacheCb: () => Promise<void>

    if (hasYarnLock && !forceCopyDependencies) {
      await symlinkNodeModulesFromCache(tmpNodeModulesDir, cacheNodeModulesDir)
    } else {
      // due to an issue in NPM, we cannot have `node_modules` be a symlink. fall back to copying.
      // https://github.com/npm/npm/issues/10013
      persistCacheCb = await copyNodeModulesFromCache(tmpNodeModulesDir, cacheNodeModulesDir)
    }

    // 2. Before running the package installer, resolve workspace deps to absolute paths.
    // This is required to fix install for workspace-only packages.
    const workspaceDeps = await makeWorkspacePackagesAbsolute(projectPkgJsonPath)

    // 3. Delete cached workspace packages since the pkg manager will create a fresh symlink during install.
    await removeWorkspacePackages(workspaceDeps)

    // 4. Fix relative paths in temp dir's lockfile.
    const lockFilePath = path.join(projectDir, lockFilename)

    console.log(lockFilePath)

    log(`Writing ${lockFilename} with fixed relative paths to temp dir`)
    await restoreLockFileRelativePaths({ projectDir, lockFilePath, relativePathToMonorepoRoot })

    // 5. Run `yarn/npm install`.
    const getCommandFn = hasYarnLock ? getYarnCommand : getNpmCommand
    const cmd = getCommandFn({
      updateLockFile,
      yarnV311: pkgJson._cyYarnV311,
      isCI: !!process.env.CI,
      runScripts: pkgJson._cyRunScripts,
    })

    await runCmd(cmd)

    // 6. Now that the lockfile is up to date, update workspace dependency paths in the lockfile with monorepo
    // relative paths so it can be the same for all developers
    log(`Copying ${lockFilename} and fixing relative paths for ${project}`)
    await normalizeLockFileRelativePaths({ project, projectDir, lockFilePath, lockFilename, relativePathToMonorepoRoot })

    // 7. After install, we must now symlink *over* all workspace dependencies, or else
    // `require` calls from installed workspace deps to peer deps will fail.
    await removeWorkspacePackages(workspaceDeps)
    for (const dep of workspaceDeps) {
      const destDir = path.join(tmpNodeModulesDir, dep)
      const targetDir = pathToPackage(dep)

      log(`Symlinking workspace dependency: ${dep} (${destDir} -> ${targetDir})`)

      await fs.mkdir(path.dirname(destDir), { recursive: true })
      await fs.symlink(targetDir, destDir, 'junction')
    }

    // 8. If necessary, ensure that the `node_modules` cache is updated by copying `node_modules` back.
    if (persistCacheCb) await persistCacheCb()
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') return

    // if the symlink already exists, return as we do not need to relink the directory
    if (err.code === 'EEXIST') return

    console.error(`⚠ An error occurred while installing the node_modules for ${project}.`)
    console.error(err)
    throw err
  }
}

/**
 * Create symlinks to very commonly used (in example projects) `node_modules`.
 *
 * This is done because many `projects` use the same modules, like `lodash`, and it's not worth it
 * to increase CI install times just to have it explicitly specified by `package.json`. A symlink
 * is faster than a real `npm install`.
 *
 * Adding modules here *decreases the quality of test coverage* because it allows test projects
 * to make assumptions about what modules are available that don't hold true in the real world. So
 * *do not add a module here* unless you are really sure that it should be available in every
 * single test project.
 */
export async function scaffoldCommonNodeModules () {
  await Promise.all([
    '@babel/preset-env',
    '@babel/preset-react',
    'babel-loader',
    // Used for import { defineConfig } from 'cypress'
    'cypress',
    '@cypress/webpack-dev-server',
    '@packages/socket',
    '@packages/ts',
    '@tooling/system-tests',
    'bluebird',
    'chai',
    'dayjs',
    'debug',
    'execa',
    'fs-extra',
    'https-proxy-agent',
    'jimp',
    'lazy-ass',
    'lodash',
    'playwright-webkit',
    'proxyquire',
    'semver',
    'systeminformation',
    'tslib',
    'typescript',
  ].map(symlinkNodeModule))
}

export async function symlinkNodeModule (pkg) {
  const from = path.join(cyTmpDir, 'node_modules', pkg)
  const to = pathToPackage(pkg)

  await fs.ensureDir(path.dirname(from))
  try {
    await fs.symlink(to, from, 'junction')
  } catch (err) {
    if (err.code === 'EEXIST') return

    throw err
  }
}
