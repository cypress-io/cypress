const fs = require('fs-extra')
const path = require('path')
const chokidar = require('chokidar')
const os = require('os')

const root = path.join(__dirname, '..')

const serverRoot = path.join(__dirname, '../../packages/server/')
const projects = path.join(root, 'projects')
const tmpDir = path.join(os.tmpdir(), 'cy-projects')

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

module.exports = {
  // copies all of the project fixtures
  // to the tmpDir .projects in the root
  scaffold () {
    fs.copySync(projects, tmpDir)
  },

  scaffoldProject (project) {
    const from = path.join(projects, project)
    const to = path.join(tmpDir, project)

    fs.copySync(from, to)
  },

  scaffoldCommonNodeModules () {
    fs.removeSync(path.join(tmpDir, 'node_modules'))

    ;[
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
    ].forEach((pkg) => {
      const from = path.join(tmpDir, 'node_modules', pkg)
      const to = path.dirname(require.resolve(`${pkg}/package.json`))

      fs.ensureDirSync(path.dirname(from))
      fs.symlinkSync(to, from, 'junction')
    })
  },

  // TODO
  scaffoldWatch () {
    const watchdir = path.resolve(__dirname, '../projects')

    console.log('watching files due to --no-exit', watchdir)

    chokidar.watch(watchdir, {
    })
    .on('change', (srcFilepath, stats) => {
      const tmpFilepath = path.join(tmpDir, path.relative(watchdir, srcFilepath))

      return copyContents(srcFilepath, tmpFilepath)
    })
    .on('error', console.error)
  },

  // removes all of the project fixtures
  // from the tmpDir .projects in the root
  remove () {
    return fs.removeSync(tmpDir)
  },

  async installStubPackage (projectPath, pkgName) {
    const pathToPkg = path.join(projectPath, 'node_modules', pkgName)

    await fs.outputJSON(path.join(projectPath, 'package.json'), { name: 'some-project' })
    await fs.mkdirp(pathToPkg)
    await fs.outputFile(path.join(pathToPkg, 'index.js'), '')
  },

  // returns the path to project fixture
  // in the tmpDir
  project (...args) {
    return this.projectPath.apply(this, args)
  },

  projectPath (name) {
    return path.join(tmpDir, name)
  },

  get (fixture, encoding = 'utf8') {
    return fs.readFileSync(path.join(serverRoot, 'test', 'support', 'fixtures', fixture), encoding)
  },

  path (fixture) {
    return path.join(serverRoot, 'test', 'support', 'fixtures', fixture)
  },
}
