import fs from 'fs-extra'
import _path from 'path'
import chokidar from 'chokidar'
import os from 'os'
import cachedir from 'cachedir'
import execa from 'execa'

const root = _path.join(__dirname, '..')

const serverRoot = _path.join(__dirname, '../../packages/server/')
const projects = _path.join(root, 'projects')
const tmpDir = _path.join(os.tmpdir(), 'cy-projects')

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
// to the tmpDir .projects in the root
export function scaffold () {
  fs.copySync(projects, tmpDir)
}

/**
 * Given a project name, copy the project's test files to the temp dir.
 */
export function scaffoldProject (project: string): void {
  const from = _path.join(projects, project)
  const to = _path.join(tmpDir, project)

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

  await fs.symlink(cacheDir, from, 'junction')
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

      if (version === '0.0.0-development') {
        const depPkgJson = require(`${dep}/package.json`)
        const absPath = pathToPackage(dep)

        console.log(`📦 Setting absolute path in package.json for ${dep}: ${absPath}.`)
        if (depPkgJson.version !== version) throw new Error(`Version mismatch (${depPkgJson.version} in ${dep}, but test project wants ${version})`)

        deps[dep] = absPath
        updatedDeps.push(dep)
      }
    }
  }

  await fs.writeJson(pathToPkgJson, pkgJson)

  return updatedDeps
}

const relativePathToken = '<<RELATIVE PATH TO MONOREPO ROOT>>'

/**
 * Given a `system-tests` project name, detect and install the `node_modules`
 * specified in the project's `package.json`. No-op if no `package.json` is found.
 */
export async function scaffoldProjectNodeModules (project: string): Promise<void> {
  const projectDir = projectPath(project)
  const projectPkgJsonPath = _path.join(projectDir, 'package.json')

  const runCmd = async (cmd) => {
    console.log(`📦 Running "${cmd}" in ${projectDir}`)
    await execa.shell(cmd, { cwd: projectDir, stdio: 'inherit' })
  }

  const cacheDir = _path.join(cachedir('cy-system-tests-node-modules'), project, 'node_modules')
  // const cacheDir = _path.join(process.env.CI ? 'TBD' : cachedir('cy-system-tests-node-modules'), project, 'node_modules')

  async function removeWorkspacePackages (packages: string[]): Promise<void> {
    for (const dep of packages) {
      const depDir = _path.join(cacheDir, dep)

      await fs.remove(depDir)
    }
  }

  const updateYarnLock = !!process.env.UPDATE_YARN_LOCK

  try {
    // this will throw and exit early if the package.json does not exist
    const pkgJson = require(projectPkgJsonPath)

    console.log(`📦 Found package.json for project ${project}.`)

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
      .replace(new RegExp(relativePathToken, 'gm'), relativePathToProjectDir)

      await fs.writeFile(yarnLockPath, yarnLock)
    } catch (err) {
      if (err.code !== 'ENOENT' || !updateYarnLock) throw err

      console.log('📦 No yarn.lock found, continuing')
    }

    // 4. Run `yarn install` with `--frozen-lockfile` by default.
    await runCmd(`yarn install --ignore-scripts${updateYarnLock ? '' : ' --frozen-lockfile'}`)

    if (updateYarnLock) {
      // TODO: do this but less hacky
      afterEach(require('lodash/once')(async () => {
        console.log(`📦 Copying yarn.lock and fixing relative paths for ${project}`)

        // Replace workspace dependency paths in `yarn.lock` with tokens so it can be the same
        // for all developers
        const yarnLock = (await fs.readFile(yarnLockPath, 'utf8'))
        .replace(new RegExp(relativePathToProjectDir, 'gm'), relativePathToken)

        await fs.writeFile(_path.join(root, 'projects', project, 'yarn.lock'), yarnLock)
      }))
    }

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
  const from = _path.join(tmpDir, 'node_modules', pkg)
  const to = pathToPackage(pkg)

  await fs.ensureDirSync(_path.dirname(from))
  try {
    await fs.symlinkSync(to, from, 'junction')
  } catch (err) {
    if (err.code === 'EEXIST') return

    throw err
  }
}

// TODO
export function scaffoldWatch () {
  const watchdir = _path.resolve(__dirname, '../projects')

  console.log('watching files due to --no-exit', watchdir)

  chokidar.watch(watchdir, {
  })
  .on('change', (srcFilepath, stats) => {
    const tmpFilepath = _path.join(tmpDir, _path.relative(watchdir, srcFilepath))

    return copyContents(srcFilepath, tmpFilepath)
  })
  .on('error', console.error)
}

// removes all of the project fixtures
// from the tmpDir .projects in the root
export function remove () {
  return fs.removeSync(tmpDir)
}

// returns the path to project fixture
// in the tmpDir
export function project (...args) {
  return this.projectPath.apply(this, args)
}

export function projectPath (name) {
  return _path.join(tmpDir, name)
}

export function get (fixture, encoding: BufferEncoding = 'utf8') {
  return fs.readFileSync(_path.join(serverRoot, 'test', 'support', 'fixtures', fixture), { encoding })
}

export function path (fixture) {
  return _path.join(serverRoot, 'test', 'support', 'fixtures', fixture)
}

export default module.exports
