import fs from 'fs-extra'
import _path from 'path'
import chokidar from 'chokidar'
import tempDir from 'temp-dir'
import type { ProjectFixtureDir } from './fixtureDirs'

export const root = _path.join(__dirname, '..')

const serverRoot = _path.join(__dirname, '../../packages/server/')

export { fixtureDirs, ProjectFixtureDir } from './fixtureDirs'

export const projects = _path.join(root, 'projects')

export const projectFixtures = _path.join(root, 'project-fixtures')

export const cyTmpDir = _path.join(tempDir, 'cy-projects')

const projectFixtureDirs = fs.readdirSync(projectFixtures, { withFileTypes: true }).filter((f) => f.isDirectory()).map((f) => f.name)

const safeRemove = (path) => {
  try {
    fs.removeSync(path)
  } catch (_err) {
    const err = _err as NodeJS.ErrnoException

    // Windows does not like the en masse deleting of files, since the AV will hold
    // a lock on files when they are written. This skips deleting if the lock is
    // encountered.
    if (err.code === 'EBUSY' && process.platform === 'win32') {
      return console.error(`Remove failed for ${ path } due to EBUSY. Skipping on Windows.`)
    }

    throw err
  }
}

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
 * Returns the scaffolded directory
 */
export async function scaffoldProject (project: ProjectFixtureDir): Promise<string> {
  const to = _path.join(cyTmpDir, project)
  const from = projectFixturePath(project)

  fs.copySync(from, to)

  try {
    const packageJson = require(`${to}/package.json`)
    const fixtureDir = packageJson.projectFixtureDirectory

    if (fixtureDir) {
      if (!projectFixtureDirs.includes(fixtureDir)) {
        throw new Error(`Invalid project fixture directory: ${fixtureDir}, expected one of ${projectFixtureDirs}`)
      }

      await fs.copy(_path.join(projectFixtures, fixtureDir), to, { overwrite: false })
    }
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e
    }
  }

  return to
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
  safeRemove(cyTmpDir)
}

export function removeProject (name: ProjectFixtureDir) {
  safeRemove(projectPath(name))
}

// Removes node_modules that might have been leftover from an initial "yarn"
// in the fixture dir
export function clearFixtureNodeModules (name: ProjectFixtureDir) {
  try {
    safeRemove(_path.join(projects, name, 'node_modules'))
  } catch {
    //
  }
}

// returns the path to project fixture
// in the cyTmpDir
export function project (name: ProjectFixtureDir) {
  return projectPath(name)
}

export function projectPath (name: ProjectFixtureDir) {
  return _path.join(cyTmpDir, name)
}

export function get (fixture, encoding: BufferEncoding = 'utf8') {
  return fs.readFileSync(_path.join(serverRoot, 'test', 'support', 'fixtures', fixture), { encoding })
}

export function path (fixture: ProjectFixtureDir) {
  return _path.join(serverRoot, 'test', 'support', 'fixtures', fixture)
}

export function projectFixturePath (name: ProjectFixtureDir) {
  return _path.join(projects, name)
}

export default module.exports
