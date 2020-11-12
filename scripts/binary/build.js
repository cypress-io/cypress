const _ = require('lodash')
const fse = require('fs-extra')
const os = require('os')
const del = require('del')
const path = require('path')
const cp = require('child_process')
const chalk = require('chalk')
const Promise = require('bluebird')
const pluralize = require('pluralize')
const execa = require('execa')
const electron = require('@packages/electron')
const debug = require('debug')('cypress:binary')
const R = require('ramda')
const la = require('lazy-ass')
const check = require('check-more-types')

const meta = require('./meta')
const smoke = require('./smoke')
const packages = require('./util/packages')
const xvfb = require('../../cli/lib/exec/xvfb')
const { transformRequires } = require('./util/transform-requires')
const { testStaticAssets } = require('./util/testStaticAssets')
const performanceTracking = require('../../packages/server/test/support/helpers/performance.js')

const rootPackage = require('@packages/root')

const fs = Promise.promisifyAll(fse)

const logger = function (msg, platform) {
  const time = new Date()
  const timeStamp = time.toLocaleTimeString()

  return console.log(timeStamp, chalk.yellow(msg), chalk.blue(platform))
}

const logBuiltAllPackages = () => {
  return console.log('built all packages')
}

// can pass options to better control the build
// for example
//   skipClean - do not delete "dist" folder before build
const buildCypressApp = function (platform, version, options = {}) {
  la(check.unemptyString(version), 'missing version to build', version)

  const distDir = _.partial(meta.distDir, platform)
  const buildDir = _.partial(meta.buildDir, platform)
  const buildAppDir = _.partial(meta.buildAppDir, platform)

  const log = _.partialRight(logger, platform)

  const testVersion = (folderNameFn) => {
    return (function () {
      log('#testVersion')
      const dir = folderNameFn()

      la(check.unemptyString(dir), 'missing folder for platform', platform)
      console.log('testing dist package version')
      console.log('by calling: node index.js --version')
      console.log('in the folder %s', dir)

      return execa('node', ['index.js', '--version'], {
        cwd: dir,
      }).then((result) => {
        la(check.unemptyString(result.stdout),
          'missing output when getting built version', result)

        console.log('app in %s', dir)
        console.log('built app version', result.stdout)
        la(result.stdout === version, 'different version reported',
          result.stdout, 'from input version to build', version)

        return console.log('✅ using node --version works')
      })
    })
  }

  const testBuiltStaticAssets = function () {
    log('#testBuiltStaticAssets')

    return testStaticAssets(distDir())
  }

  const checkPlatform = function () {
    log('#checkPlatform')
    if (platform === os.platform()) {
      return
    }

    console.log(`trying to build ${platform} from ${os.platform()}`)
    if ((platform === 'linux') && (os.platform() === 'darwin')) {
      console.log('npm run binary-build-linux')
    }

    return Promise.reject(new Error('Build platform mismatch'))
  }

  const cleanupPlatform = function () {
    log('#cleanupPlatform')

    if (options.skipClean) {
      log('skipClean')

      return
    }

    const cleanup = function () {
      const dir = distDir()

      la(check.unemptyString(dir), 'empty dist dir', dir, 'for platform', platform)

      return fs.removeAsync(distDir())
    }

    return cleanup()
    .catch(cleanup)
  }

  const buildPackages = function () {
    log('#buildPackages')

    return packages.runAllBuild()
    // Promise.resolve()
    .then(R.tap(logBuiltAllPackages))
  }

  const copyPackages = function () {
    log('#copyPackages')

    return packages.copyAllToDist(distDir())
  }

  const transformSymlinkRequires = function () {
    log('#transformSymlinkRequires')

    return transformRequires(distDir())
    .then((replaceCount) => {
      return la(replaceCount > 5, 'expected to replace more than 5 symlink requires, but only replaced', replaceCount)
    })
  }

  const npmInstallPackages = function () {
    log('#npmInstallPackages')

    const pathToPackages = distDir('packages', '*')

    return packages.npmInstallAll(pathToPackages)
  }

  /**
   * Creates the package.json file that sits in the root of the output app
   */
  const createRootPackage = function () {
    log(`#createRootPackage ${platform} ${version}`)

    const electronVersion = electron.getElectronVersion()

    la(electronVersion, 'missing Electron version', electronVersion)

    return electron.getElectronNodeVersion()
    .then((electronNodeVersion) => {
      la(electronNodeVersion, 'missing Electron Node version', electronNodeVersion)

      const json = {
        name: 'cypress',
        productName: 'Cypress',
        description: rootPackage.description,
        version, // Cypress version
        electronVersion,
        electronNodeVersion,
        main: 'index.js',
        scripts: {},
        env: 'production',
      }

      const outputFilename = distDir('package.json')

      debug('writing to %s json %o', outputFilename, json)

      return fs.outputJsonAsync(outputFilename, json)
      .then(() => {
        const str = `\
process.env.CYPRESS_INTERNAL_ENV = process.env.CYPRESS_INTERNAL_ENV || 'production'
require('./packages/server')\
`

        return fs.outputFileAsync(distDir('index.js'), str)
      })
    })
  }

  const removeTypeScript = function () {
    // remove the .ts files in our packages
    log('#removeTypeScript')

    return del([
      // include ts files of packages
      distDir('**', '*.ts'),

      // except those in node_modules
      `!${distDir('**', 'node_modules', '**', '*.ts')}`,
    ])
    .then((paths) => {
      console.log(
        'deleted %d TS %s',
        paths.length,
        pluralize('file', paths.length),
      )

      return console.log(paths)
    })
  }

  // we also don't need ".bin" links inside Electron application
  // thus we can go through dist/packages/*/node_modules and remove all ".bin" folders
  const removeBinFolders = function () {
    log('#removeBinFolders')

    const searchMask = distDir('packages', '*', 'node_modules', '.bin')

    console.log('searching for', searchMask)

    return del([searchMask])
    .then((paths) => {
      console.log(
        'deleted %d .bin %s',
        paths.length,
        pluralize('folder', paths.length),
      )

      return console.log(paths)
    })
  }

  const removeCyFolders = function () {
    log('#removeCyFolders')

    const searchMask = distDir('packages', 'server', '.cy')

    console.log('searching', searchMask)

    return del([searchMask])
    .then((paths) => {
      console.log(
        'deleted %d .cy %s',
        paths.length,
        pluralize('file', paths.length),
      )

      return console.log(paths)
    })
  }

  const cleanJs = function () {
    log('#cleanJs')

    return packages.runAllCleanJs()
  }

  const getIconFilename = function (platform) {
    const filenames = {
      darwin: 'cypress.icns',
      win32: 'cypress.ico',
      linux: 'icon_512x512.png',
    }
    const iconFilename = electron.icons().getPathToIcon(filenames[platform])

    console.log(`For platform ${platform} using icon ${iconFilename}`)

    return iconFilename
  }

  const electronPackAndSign = function () {
    log('#electronPackAndSign')

    // See the internal wiki document "Signing Test Runner on MacOS"
    // to learn how to get the right Mac certificate for signing and notarizing
    // the built Test Runner application

    const appFolder = distDir()
    const outputFolder = meta.buildRootDir(platform)
    const electronVersion = electron.getElectronVersion()

    la(check.unemptyString(electronVersion), 'missing Electron version to pack', electronVersion)
    const iconFilename = getIconFilename(platform)

    console.log(`output folder: ${outputFolder}`)

    const args = [
      '--publish=never',
      `--c.electronVersion=${electronVersion}`,
      `--c.directories.app=${appFolder}`,
      `--c.directories.output=${outputFolder}`,
      `--c.icon=${iconFilename}`,
      // for now we cannot pack source files in asar file
      // because electron-builder does not copy nested folders
      // from packages/*/node_modules
      // see https://github.com/electron-userland/electron-builder/issues/3185
      // so we will copy those folders later ourselves
      '--c.asar=false',
    ]
    const opts = {
      stdio: 'inherit',
    }

    console.log('electron-builder arguments:')
    console.log(args.join(' '))

    return execa('electron-builder', args, opts)
  }

  const removeDevElectronApp = function () {
    log('#removeDevElectronApp')
    // when we copy packages/electron, we get the "dist" folder with
    // empty Electron app, symlinked to our server folder
    // in production build, we do not need this link, and it
    // would not work anyway with code signing

    // hint: you can see all symlinks in the build folder
    // using "find build/darwin/Cypress.app/ -type l -ls"
    console.log('platform', platform)
    const electronDistFolder = distDir('packages', 'electron', 'dist')

    la(check.unemptyString(electronDistFolder),
      'empty electron dist folder for platform', platform)

    console.log(`Removing unnecessary folder '${electronDistFolder}'`)

    return fs.removeAsync(electronDistFolder) // .catch(_.noop) why are we ignoring an error here?!
  }

  const lsDistFolder = function () {
    log('#lsDistFolder')
    const buildFolder = buildDir()

    console.log('in build folder %s', buildFolder)

    return execa('ls', ['-la', buildFolder])
    .then(R.prop('stdout'))
    .then(console.log)
  }

  const runSmokeTests = function () {
    log('#runSmokeTests')

    const run = function () {
      // make sure to use a longer timeout - on Mac the first
      // launch of a built application invokes gatekeeper check
      // which takes a couple of seconds
      const executablePath = meta.buildAppExecutable(platform)

      return smoke.test(executablePath)
    }

    if (xvfb.isNeeded()) {
      return xvfb.start()
      .then(run)
      .finally(xvfb.stop)
    }

    return run()
  }

  const verifyAppCanOpen = function () {
    if (platform !== 'darwin') {
      return Promise.resolve()
    }

    const appFolder = meta.zipDir(platform)

    log(`#verifyAppCanOpen ${appFolder}`)

    return new Promise((resolve, reject) => {
      const args = ['-a', '-vvvv', appFolder]

      debug(`cmd: spctl ${args.join(' ')}`)
      const sp = cp.spawn('spctl', args, { stdio: 'inherit' })

      return sp.on('exit', (code) => {
        if (code === 0) {
          return resolve()
        }

        return reject(new Error('Verifying App via GateKeeper failed'))
      })
    })
  }

  const printPackageSizes = function () {
    const appFolder = meta.buildAppDir(platform, 'packages')

    log(`#printPackageSizes ${appFolder}`)

    if (platform === 'win32') {
      return Promise.resolve()
    }

    // "du" - disk usage utility
    // -d -1 depth of 1
    // -h human readable sizes (K and M)
    const args = ['-d', '1', appFolder]

    const parseDiskUsage = function (result) {
      const lines = result.stdout.split(os.EOL)
      // will store {package name: package size}
      const data = {}

      lines.forEach((line) => {
        const parts = line.split('\t')
        const packageSize = parseFloat(parts[0])
        const folder = parts[1]

        const packageName = path.basename(folder)

        if (packageName === 'packages') {
          return // root "packages" information
        }

        data[packageName] = packageSize
      })

      return data
    }

    const printDiskUsage = function (sizes) {
      const bySize = R.sortBy(R.prop('1'))

      return console.log(bySize(R.toPairs(sizes)))
    }

    return execa('du', args)
    .then(parseDiskUsage)
    .then(R.tap(printDiskUsage))
    .then((sizes) => {
      return performanceTracking.track('test runner size', sizes)
    })
  }

  return Promise.resolve()
  .then(checkPlatform)
  .then(cleanupPlatform)
  .then(buildPackages)
  .then(copyPackages)
  .then(npmInstallPackages)
  .then(createRootPackage)
  .then(removeTypeScript)
  .then(cleanJs)
  .then(transformSymlinkRequires)
  .then(testVersion(distDir))
  .then(testBuiltStaticAssets)
  .then(removeBinFolders)
  .then(removeCyFolders)
  .then(removeDevElectronApp)
  .then(electronPackAndSign)
  .then(lsDistFolder)
  .then(testVersion(buildAppDir))
  .then(runSmokeTests)
  .then(verifyAppCanOpen)
  .then(printPackageSizes)
  .return({
    buildDir: buildDir(),
  })
}

module.exports = buildCypressApp
