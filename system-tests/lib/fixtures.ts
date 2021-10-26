import fs from 'fs-extra'
import _path from 'path'
import chokidar from 'chokidar'
import os from 'os'

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

export function scaffoldProject (project) {
  const from = _path.join(projects, project)
  const to = _path.join(tmpDir, project)

  fs.copySync(from, to)
}

export async function scaffoldCommonNodeModules () {
  await fs.remove(_path.join(tmpDir, 'node_modules'))

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
    'typescript',
  ].map(async (pkg) => {
    const from = _path.join(tmpDir, 'node_modules', pkg)
    const to = _path.dirname(require.resolve(`${pkg}/package.json`))

    await fs.ensureDirSync(_path.dirname(from))
    await fs.symlinkSync(to, from, 'junction')
  }))
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

export async function installStubPackage (projectPath, pkgName) {
  const pathToPkg = _path.join(projectPath, 'node_modules', pkgName)

  await fs.outputJSON(_path.join(projectPath, 'package.json'), { name: 'some-project' })
  await fs.mkdirp(pathToPkg)
  await fs.outputFile(_path.join(pathToPkg, 'index.js'), '')
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
