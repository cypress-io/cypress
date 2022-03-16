import fs from 'fs-extra'
import path from 'path'
import cachedir from 'cachedir'
import execa from 'execa'
import { cyTmpDir, projectPath, projects, root } from '../fixtures'
import tempDir from 'temp-dir'

/**
 * Symlink the cached `node_modules` directory to the temp project directory's `node_modules`.
 */
async function symlinkNodeModulesFromCache (project: string, cacheDir: string): Promise<void> {
  const from = path.join(projectPath(project), 'node_modules')

  try {
    await fs.stat(cacheDir)
  } catch (err) {
    console.log(`📦 Creating a new node_modules cache dir at ${cacheDir}`)
    await fs.mkdirp(cacheDir)
  }

  try {
    await fs.symlink(cacheDir, from, 'junction')
  } catch (err) {
    if (err.code !== 'EEXIST') return
  }
  console.log(`📦 node_modules symlink created at ${from}`)
}

/**
 * Given a package name, returns the path to the module directory on disk.
 */
function pathToPackage (pkg: string): string {
  return path.dirname(require.resolve(`${pkg}/package.json`))
}


/**
 * Given a path to a `package.json`, convert any references to development
 * versions of packages to absolute paths, so `yarn` will not reach out to
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

        console.log(`📦 Setting absolute path in package.json for ${dep}: ${absPath}.`)

        deps[dep] = `file:${absPath}`
        updatedDeps.push(dep)
      }
    }
  }

  await fs.writeJson(pathToPkgJson, pkgJson)

  return updatedDeps
}

function getYarnCommand (opts: {
  yarnV311: boolean
  updateYarnLock: boolean
  isCI: boolean
  runScripts: boolean
}): string {
  let cmd = `yarn install`

  if (opts.yarnV311) {
    // @see https://yarnpkg.com/cli/install
    if (!opts.runScripts) cmd += ' --mode=skip-build'

    if (!opts.updateYarnLock) cmd += ' --immutable'

    return cmd
  }

  cmd += ' --prefer-offline'

  if (!opts.runScripts) cmd += ' --ignore-scripts'

  if (!opts.updateYarnLock) cmd += ' --frozen-lockfile'

  // yarn v1 has a bug with integrity checking and local cache/dependencies
  // @see https://github.com/yarnpkg/yarn/issues/6407
  cmd += ' --update-checksums'

  // in CircleCI, this offline cache can be used
  if (opts.isCI) cmd += ` --cache-folder=~/.yarn-${process.platform} `
  else cmd += ` --cache-folder=${path.join(tempDir, 'cy-system-tests-yarn-cache', String(Date.now()))}`

  return cmd
}

type Dependencies = Record<string, string>

/**
 * Type for package.json files for system-tests example projects.
 */
type SystemTestPkgJson = {
  /**
   * By default, scaffolding will run `yarn install` if there is a `package.json`.
   * This option, if set, disables that.
   */
  _cySkipYarnInstall?: boolean
  /**
   * Run the yarn v2-style install command instead of yarn v1-style.
   */
  _cyYarnV311?: boolean
  /**
   * By default, the automatic `yarn install` will not run postinstall scripts. This
   * option, if set, will cause postinstall scripts to run for this project.
   */
  _cyRunScripts?: boolean
  dependencies?: Dependencies
  devDependencies?: Dependencies
  optionalDependencies?: Dependencies
}

/**
 * Given a `system-tests` project name, detect and install the `node_modules`
 * specified in the project's `package.json`. No-op if no `package.json` is found.
 */
export async function scaffoldProjectNodeModules (project: string, updateYarnLock: boolean = !!process.env.UPDATE_YARN_LOCK): Promise<void> {
  const projectDir = projectPath(project)
  const relativePathToMonorepoRoot = path.relative(
    path.join(projects, project),
    path.join(root, '..'),
  )
  const projectPkgJsonPath = path.join(projectDir, 'package.json')

  const runCmd = async (cmd) => {
    console.log(`📦 Running "${cmd}" in ${projectDir}`)
    await execa(cmd, { cwd: projectDir, stdio: 'inherit', shell: true })
  }

  const cacheDir = path.join(cachedir('cy-system-tests-node-modules'), project, 'node_modules')

  async function removeWorkspacePackages (packages: string[]): Promise<void> {
    for (const dep of packages) {
      const depDir = path.join(cacheDir, dep)

      await fs.remove(depDir)
    }
  }

  try {
    // this will throw and exit early if the package.json does not exist
    const pkgJson: SystemTestPkgJson = require(projectPkgJsonPath)

    console.log(`📦 Found package.json for project ${project}.`)

    if (pkgJson._cySkipYarnInstall) {
      return console.log(`📦 cySkipYarnInstall set in package.json, skipping yarn steps`)
    }

    if (!pkgJson.dependencies && !pkgJson.devDependencies && !pkgJson.optionalDependencies) {
      return console.log(`📦 No dependencies found, skipping yarn steps`)
    }

    // 1. Ensure there is a cache directory set up for this test project's `node_modules`.
    await symlinkNodeModulesFromCache(project, cacheDir)

    // 2. Before running `yarn`, resolve workspace deps to absolute paths.
    // This is required to fix `yarn install` for workspace-only packages.
    const workspaceDeps = await makeWorkspacePackagesAbsolute(projectPkgJsonPath)

    await removeWorkspacePackages(workspaceDeps)

    // 3. Fix relative paths in temp dir's `yarn.lock`.
    const relativePathToProjectDir = path.relative(projectDir, path.join(root, '..'))
    const yarnLockPath = path.join(projectDir, 'yarn.lock')

    console.log('📦 Writing yarn.lock with fixed relative paths to temp dir')
    try {
      const yarnLock = (await fs.readFile(yarnLockPath, 'utf8'))
      .replaceAll(relativePathToMonorepoRoot, relativePathToProjectDir)

      await fs.writeFile(yarnLockPath, yarnLock)
    } catch (err) {
      if (err.code !== 'ENOENT' || !updateYarnLock) throw err

      console.log('📦 No yarn.lock found, continuing')
    }

    // 4. Run `yarn install`.
    const cmd = getYarnCommand({
      updateYarnLock,
      yarnV311: pkgJson._cyYarnV311,
      isCI: !!process.env.CI,
      runScripts: pkgJson._cyRunScripts,
    })

    await runCmd(cmd)

    console.log(`📦 Copying yarn.lock and fixing relative paths for ${project}`)

    // Replace workspace dependency paths in `yarn.lock` with tokens so it can be the same
    // for all developers
    const yarnLock = (await fs.readFile(yarnLockPath, 'utf8'))
    .replaceAll(relativePathToProjectDir, relativePathToMonorepoRoot)

    await fs.writeFile(path.join(projects, project, 'yarn.lock'), yarnLock)

    // 5. After `yarn install`, we must now symlink *over* all workspace dependencies, or else
    // `require` calls from `yarn install`'d workspace deps to peer deps will fail.
    await removeWorkspacePackages(workspaceDeps)
    for (const dep of workspaceDeps) {
      console.log(`📦 Symlinking workspace dependency: ${dep}`)
      const depDir = path.join(cacheDir, dep)

      await fs.symlink(pathToPackage(dep), depDir, 'junction')
    }
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') return

    console.error(`⚠ An error occurred while installing the node_modules for ${project}.`)
    console.error([err.message, err.stack].join('\n'))
    throw err
  }
}

export async function scaffoldCommonNodeModules () {
  await Promise.all([
    '@cypress/code-coverage',
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
    'proxyquire',
    'react',
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
