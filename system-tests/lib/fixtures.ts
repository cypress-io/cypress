import fs from 'fs-extra'
import _path from 'path'
import chokidar from 'chokidar'
import tempDir from 'temp-dir'

export const root = _path.join(__dirname, '..')

const serverRoot = _path.join(__dirname, '../../packages/server/')

export const projects = _path.join(root, 'projects')

export const cyTmpDir = _path.join(tempDir, 'cy-projects')

const safeRemove = (path) => {
  try {
    fs.removeSync(path)
  } catch (err) {
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
 */
export async function scaffoldProject (project: string): Promise<void> {
  const to = _path.join(cyTmpDir, project)
  const from = _path.join(projects, project)

  await fs.copy(from, to)
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

export function removeProject (name) {
  safeRemove(projectPath(name))
}

// returns the path to project fixture
// in the cyTmpDir
export function project (name) {
  return projectPath(name)
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
