import fs from 'fs-extra'
import _path from 'path'
import chokidar from 'chokidar'
import cachedir from 'cachedir'
import execa from 'execa'
import tempDir from 'temp-dir'

const root = _path.join(__dirname, '..')

const serverRoot = _path.join(__dirname, '../../packages/server/')
const projects = _path.join(root, 'projects')
const cyTmpDir = _path.join(tempDir, 'cy-projects')

// copy contents instead of deleting+creating new file, which can cause
// filewatchers to lose track of toFile.
const copyContents = (fromFile, toFile) => {
  return Promise.all([
    fs.open(toFile, 'w'),
    fs.readFile(fromFile),
  ])
  .then(([toFd, fromFileBuf]) => {
    return fs.write(toFd, fromFileBuf)
    .finally(() => {
      return fs.close(toFd)
    })
  })
}

// copies all of the project fixtures
// to the cyTmpDir .projects in the root
export function scaffold () {
  fs.copySync(projects, cyTmpDir)
}

/**
 * Given a project name, copy the project's test files to the temp dir.
 */
export function scaffoldProject (project: string): void {
  const from = _path.join(projects, project)
  const to = _path.join(cyTmpDir, project)

  fs.copySync(from, to)
}

/**
 * Symlink the cached `node_modules` directory to the temp project directory's `node_modules`.
 */
async function symlinkNodeModulesFromCache (project: string, cacheDir: string): Promise<void> {
  const from = _path.join(projectPath(project), 'node_modules')

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
  return _path.dirname(require.resolve(`${pkg}/package.json`))
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
  yarnV2: boolean
  updateYarnLock: boolean
  isCI: boolean
  runScripts: boolean
}): string {
  let cmd = `yarn install`

  if (opts.yarnV2) {
    // yarn v2's docs are no longer available on their site now that yarn v3 is out,
    // Internet Archive has them here:
    // @see https://web.archive.org/web/20210102223647/https://yarnpkg.com/cli/install
    if (!opts.runScripts) cmd += ' --skip-builds'

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
  else cmd += ` --cache-folder=${_path.join(tempDir, 'cy-system-tests-yarn-cache', String(Date.now()))}`

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
  _cyYarnV2?: boolean
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
  const relativePathToMonorepoRoot = _path.relative(
    _path.join(projects, project),
    _path.join(root, '..'),
  )
  const projectPkgJsonPath = _path.join(projectDir, 'package.json')

  const runCmd = async (cmd) => {
    console.log(`📦 Running "${cmd}" in ${projectDir}`)
    await execa(cmd, { cwd: projectDir, stdio: 'inherit', shell: true })
  }

  const cacheDir = _path.join(cachedir('cy-system-tests-node-modules'), project, 'node_modules')

  async function removeWorkspacePackages (packages: string[]): Promise<void> {
    for (const dep of packages) {
      const depDir = _path.join(cacheDir, dep)

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
    const relativePathToProjectDir = _path.relative(projectDir, _path.join(root, '..'))
    const yarnLockPath = _path.join(projectDir, 'yarn.lock')

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
      yarnV2: pkgJson._cyYarnV2,
      isCI: !!process.env.CI,
      runScripts: pkgJson._cyRunScripts,
    })

    await runCmd(cmd)

    console.log(`📦 Copying yarn.lock and fixing relative paths for ${project}`)

    // Replace workspace dependency paths in `yarn.lock` with tokens so it can be the same
    // for all developers
    const yarnLock = (await fs.readFile(yarnLockPath, 'utf8'))
    .replaceAll(relativePathToProjectDir, relativePathToMonorepoRoot)

    await fs.writeFile(_path.join(projects, project, 'yarn.lock'), yarnLock)

    // 5. After `yarn install`, we must now symlink *over* all workspace dependencies, or else
    // `require` calls from `yarn install`'d workspace deps to peer deps will fail.
    await removeWorkspacePackages(workspaceDeps)
    for (const dep of workspaceDeps) {
      console.log(`📦 Symlinking workspace dependency: ${dep}`)
      const depDir = _path.join(cacheDir, dep)

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
  const from = _path.join(cyTmpDir, 'node_modules', pkg)
  const to = pathToPackage(pkg)

  await fs.ensureDir(_path.dirname(from))
  try {
    await fs.symlink(to, from, 'junction')
  } catch (err) {
    if (err.code === 'EEXIST') return

    throw err
  }
}

export function scaffoldWatch () {
  const watchdir = _path.resolve(__dirname, '../projects')

  console.log('watching files due to --no-exit', watchdir)

  chokidar.watch(watchdir, {
  })
  .on('change', (srcFilepath, stats) => {
    const tmpFilepath = _path.join(cyTmpDir, _path.relative(watchdir, srcFilepath))

    return copyContents(srcFilepath, tmpFilepath)
  })
  .on('error', console.error)
}

// removes all of the project fixtures
// from the cyTmpDir .projects in the root
export function remove () {
  return fs.removeSync(cyTmpDir)
}

export function removeProject (name) {
  return fs.removeSync(projectPath(name))
}

// returns the path to project fixture
// in the cyTmpDir
export function project (...args) {
  return this.projectPath.apply(this, args)
}

export function projectPath (name) {
  return _path.join(cyTmpDir, name)
}

export function get (fixture, encoding: BufferEncoding = 'utf8') {
  return fs.readFileSync(_path.join(serverRoot, 'test', 'support', 'fixtures', fixture), { encoding })
}

export function path (fixture) {
  return _path.join(serverRoot, 'test', 'support', 'fixtures', fixture)
}

export default module.exports
