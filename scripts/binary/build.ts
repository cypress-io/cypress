import os from 'os'
import fs from 'fs-extra'
import path from 'path'
import _ from 'lodash'
import del from 'del'
import chalk from 'chalk'
import electron from '../../packages/electron'
import la from 'lazy-ass'
import { promisify } from 'util'
import glob from 'glob'
import tar from 'tar'

import * as packages from './util/packages'
import * as meta from './meta'
import xvfb from '../../cli/lib/exec/xvfb'
import smoke from './smoke'
import { spawn, execSync } from 'child_process'
import { transformRequires } from './util/transform-requires'
import execa from 'execa'
import { testStaticAssets } from './util/testStaticAssets'
import performanceTracking from '../../system-tests/lib/performance'
import verify from '../../cli/lib/tasks/verify'
import * as electronBuilder from 'electron-builder'

const globAsync = promisify(glob)

const CY_ROOT_DIR = path.join(__dirname, '..', '..')

const jsonRoot = fs.readJSONSync(path.join(CY_ROOT_DIR, 'package.json'))

const log = function (msg) {
  const time = new Date()
  const timeStamp = time.toLocaleTimeString()

  console.log(timeStamp, chalk.yellow(msg), chalk.blue(meta.PLATFORM))
}

interface BuildCypressAppOpts {
  platform: meta.PlatformName
  version: string
  skipSigning?: boolean
  keepBuild?: boolean
  createTar?: boolean
}

/**
 * Windows has a max path length of 260 characters. To avoid running over this when unzipping the
 * built binary, this function attempts to guard against excessively-long paths in the binary by
 * assuming an install default cache location and checking if final paths exceed 260 characters.
 */
async function checkMaxPathLength () {
  if (process.platform !== 'win32') return log('#checkMaxPathLength (skipping since not on Windows)')

  // This is the Cypress cache dir path on a vanilla Windows Server VM. We can treat this as the typical case.
  const typicalWin32PathPrefixLength = 'C:\\Users\\Administrator\\AppData\\Local\\Cypress\\Cache\\10.0.0\\resources\\app\\'.length
  const maxRelPathLength = 260 - typicalWin32PathPrefixLength

  log(`#checkMaxPathLength (max abs path length: ${maxRelPathLength})`)

  const buildDir = meta.buildDir()
  const allRelPaths = (await globAsync('**/*', { cwd: buildDir, absolute: true }))
  .map((p) => p.slice(buildDir.length))

  if (!allRelPaths.length) throw new Error('No binary paths found in checkMaxPathLength')

  const violations = allRelPaths.filter((p) => p.length > maxRelPathLength)

  if (violations.length) {
    throw new Error([
      `${violations.length} paths in the built binary were too long for Windows. Either hoist these files or remove them from the build.`,
      ...violations.map((v) => ` - ${v}`),
    ].join('\n'))
  }

  log(`All paths are short enough (${allRelPaths.length} checked)`)
}

// For debugging the flow without rebuilding each time

export async function buildCypressApp (options: BuildCypressAppOpts) {
  const { platform, version, keepBuild = false, createTar } = options

  log('#checkPlatform')
  if (platform !== os.platform()) {
    throw new Error(`Attempting to cross-build, which is not supported. Local platform: '${os.platform()}' --platform: '${platform}'`)
  }

  const DIST_DIR = meta.distDir()

  log('#cleanupPlatform')
  fs.rmSync(meta.TMP_BUILD_DIR, { force: true, recursive: true })
  fs.rmSync(path.resolve('build'), { force: true, recursive: true })
  fs.rmSync(path.resolve('packages', 'electron', 'dist'), { force: true, recursive: true })

  log(`symlinking ${meta.TMP_BUILD_DIR} -> ${path.resolve('build')}`)
  fs.symlinkSync(
    meta.TMP_BUILD_DIR,
    path.resolve('build'),
    'dir',
  )

  if (!keepBuild) {
    log('#buildPackages')

    await execa('yarn', ['lerna', 'run', 'build-prod', '--ignore', 'cli', '--concurrency', '4'], {
      stdio: 'inherit',
      cwd: CY_ROOT_DIR,
    })
  }

  // Copy Packages: We want to copy the package.json, files, and output
  log('#copyAllToDist')
  await packages.copyAllToDist(DIST_DIR)

  fs.copySync(path.join(CY_ROOT_DIR, 'patches'), path.join(DIST_DIR, 'patches'), {
    // in some cases the dependency tree for nested dependencies changes when running
    // a `yarn install` vs a `yarn install --production`. This is the case for `whatwg-url@7`,
    // which i as a dependency of `source-map`, which is a devDependency in @packages/driver.
    // This package gets hoisted by lerna to the root monorepo directory, but when install
    // is run with --production, the directory structure changes and `whatwg-url@5` is
    // installed and hoisted, which causes problems with patch-package.

    // since we are only installing production level dependencies in this case, we do not need to copy
    // dev patches into the DIST_DIR as they will not be applied anyway, allowing us to work around this problem.
    filter: (src, _) => !src.includes('.dev.patch'),
  })

  const packageJsonContents = _.omit(jsonRoot, [
    'devDependencies',
    'lint-staged',
    'engines',
    'scripts',
  ])

  fs.writeJsonSync(meta.distDir('package.json'), {
    ...packageJsonContents,
    scripts: {
      postinstall: 'patch-package',
    },
  }, { spaces: 2 })

  // Copy the yarn.lock file so we have a consistent install
  fs.copySync(path.join(CY_ROOT_DIR, 'yarn.lock'), meta.distDir('yarn.lock'))

  log('#replace local npm versions')
  const dirsSeen = await packages.replaceLocalNpmVersions(DIST_DIR)

  log('#remove local npm dirs that are not needed')
  await packages.removeLocalNpmDirs(DIST_DIR, dirsSeen)

  log('#install production dependencies')
  execSync('yarn --production', {
    cwd: DIST_DIR,
    stdio: 'inherit',
  })

  // TODO: Validate no-hoists / single copies of libs

  // Remove extra directories that are large/unneeded
  log('#remove extra dirs')
  await del([
    meta.distDir('**', 'image-q', 'demo'),
    meta.distDir('**', 'gifwrap', 'test'),
    meta.distDir('**', 'pixelmatch', 'test'),
    meta.distDir('**', '@jimp', 'tiff', 'test'),
    meta.distDir('**', '@cypress', 'icons', '**/*.{ai,eps}'),
    meta.distDir('**', 'esprima', 'test'),
    meta.distDir('**', 'bmp-js', 'test'),
    meta.distDir('**', 'exif-parser', 'test'),
    meta.distDir('**', 'app-module-path', 'test'),
  ], { force: true })

  console.log('Deleted excess directories')

  log('#createRootPackage')
  const electronVersion = electron.getElectronVersion()
  const electronNodeVersion = await electron.getElectronNodeVersion()

  fs.writeJSONSync(meta.distDir('package.json'), {
    name: 'cypress',
    productName: 'Cypress',
    description: jsonRoot.description,
    version, // Cypress version
    electronVersion,
    electronNodeVersion,
    main: 'index.js',
    scripts: {},
    env: 'production',
  }, { spaces: 2 })

  fs.writeFileSync(meta.distDir('index.js'), `\
process.env.CYPRESS_INTERNAL_ENV = process.env.CYPRESS_INTERNAL_ENV || 'production'
require('./packages/server/index.js')
`)

  // removeTypeScript
  log('#remove typescript files and devDep patches')
  await del([
    // include ts files of packages
    meta.distDir('**', '*.ts'),
    // remove dev dep patches
    meta.distDir('**', '*.dev.patch'),
    // except those in node_modules
    `!${meta.distDir('**', 'node_modules', '**', '*.ts')}`,
  ], { force: true })

  // cleanJs
  if (!keepBuild) {
    await packages.runAllCleanJs()
  }

  // transformSymlinkRequires
  log('#transformSymlinkRequires')
  await transformRequires(meta.distDir())

  // optionally create a tar of the `cypress-build` directory. This is used in CI.
  if (createTar) {
    log('#create tar from dist dir')
    await tar.c({ file: 'cypress-dist.tgz', gzip: true, cwd: os.tmpdir() }, ['cypress-build'])
  }

  log(`#testDistVersion ${meta.distDir()}`)
  await testDistVersion(meta.distDir(), version)

  log('#testStaticAssets')
  await testStaticAssets(meta.distDir())
}

export async function packageElectronApp (options: BuildCypressAppOpts) {
  const { platform, version, skipSigning = false } = options

  log('#removeCyAndBinFolders')
  await del([
    meta.distDir('node_modules', '.bin'),
    meta.distDir('packages', '*', 'node_modules', '.bin'),
    meta.distDir('packages', 'server', '.cy'),
  ], { force: true })

  // when we copy packages/electron, we get the "dist" folder with
  // empty Electron app, symlinked to our server folder
  // in production build, we do not need this link, and it
  // would not work anyway with code signing

  // hint: you can see all symlinks in the build folder
  // using "find build/darwin/Cypress.app/ -type l -ls"
  log('#removeDevElectronApp')
  fs.removeSync(meta.distDir('packages', 'electron', 'dist'))

  // electronPackAndSign
  log('#electronPackAndSign')
  // See the internal wiki document "Signing Test Runner on MacOS"
  // to learn how to get the right Mac certificate for signing and notarizing
  // the built Test Runner application

  const electronVersion = electron.getElectronVersion()

  const appFolder = meta.distDir()
  const outputFolder = meta.buildRootDir()

  const iconFilename = getIconFilename()

  console.log(`output folder: ${outputFolder}`)

  // Update the root package.json with the next app version so that it is snapshot properly
  fs.writeJSONSync(path.join(CY_ROOT_DIR, 'package.json'), {
    ...jsonRoot,
    version,
  }, { spaces: 2 })

  try {
    await electronBuilder.build({
      publish: 'never',
      config: {
        electronVersion,
        directories: {
          app: appFolder,
          output: outputFolder,
        },
        icon: iconFilename,
        // for now we cannot pack source files in asar file
        // because electron-builder does not copy nested folders
        // from packages/*/node_modules
        // see https://github.com/electron-userland/electron-builder/issues/3185
        // so we will copy those folders later ourselves
        asar: false,
      },
    })
  } catch (e) {
    if (!skipSigning) {
      throw e
    }
  }

  // Revert the root package.json so that subsequent steps will work properly
  fs.writeJSONSync(path.join(CY_ROOT_DIR, 'package.json'), jsonRoot, { spaces: 2 })

  await checkMaxPathLength()

  // lsDistFolder
  console.log('in build folder %s', meta.buildDir())

  const { stdout } = await execa('ls', ['-la', meta.buildDir()])

  console.log(stdout)

  // runSmokeTests
  let usingXvfb = xvfb.isNeeded()

  try {
    if (usingXvfb) {
      await xvfb.start()
    }

    log(`#testExecutableVersion ${meta.buildAppExecutable()}`)
    await testExecutableVersion(meta.buildAppExecutable(), version)

    const executablePath = meta.buildAppExecutable()

    await smoke.test(executablePath, meta.buildAppDir())
  } finally {
    if (usingXvfb) {
      await xvfb.stop()
    }
  }

  // verifyAppCanOpen
  if (platform === 'darwin' && !skipSigning) {
    const appFolder = meta.zipDir()

    await new Promise<void>((resolve, reject) => {
      const args = ['-a', '-vvvv', appFolder]

      console.log(`cmd: spctl ${args.join(' ')}`)
      const sp = spawn('spctl', args, { stdio: 'inherit' })

      return sp.on('exit', (code) => {
        if (code === 0) {
          return resolve()
        }

        return reject(new Error('Verifying App via GateKeeper failed'))
      })
    })
  }

  if (platform === 'win32') {
    return
  }

  log(`#printPackageSizes ${appFolder}`)

  // "du" - disk usage utility
  // -d -1 depth of 1
  // -h human readable sizes (K and M)
  const diskUsageResult = await execa('du', ['-d', '1', appFolder])

  const lines = diskUsageResult.stdout.split(os.EOL)

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

  const sizes = _.fromPairs(_.sortBy(_.toPairs(data), 1))

  console.log(sizes)

  performanceTracking.track('test runner size', sizes)
}

function getIconFilename () {
  const filenames = {
    darwin: 'cypress.icns',
    win32: 'cypress.ico',
    linux: 'icon_512x512.png',
  }
  const iconFilename = electron.icons().getPathToIcon(filenames[meta.PLATFORM])

  console.log(`For platform ${meta.PLATFORM} using icon ${iconFilename}`)

  return iconFilename
}

async function testDistVersion (distDir: string, version: string) {
  log('#testVersion')

  console.log('testing dist package version')
  console.log('by calling: node index.js --version')
  console.log('in the folder %s', distDir)

  const result = await execa('node', ['index.js', '--version'], {
    cwd: distDir,
  })

  la(result.stdout, 'missing output when getting built version', result)

  console.log('app in %s', distDir)
  console.log('built app version', result.stdout)
  la(result.stdout.trim() === version.trim(), 'different version reported',
    result.stdout, 'from input version to build', version)

  console.log('✅ using node --version works')
}

async function testExecutableVersion (buildAppExecutable: string, version: string) {
  log('#testVersion')

  console.log('testing built app executable version')
  console.log(`by calling: ${buildAppExecutable} --version`)

  const args = ['--version']

  if (verify.needsSandbox()) {
    args.push('--no-sandbox')
  }

  const result = await execa(buildAppExecutable, args)

  la(result.stdout, 'missing output when getting built version', result)

  console.log('built app version', result.stdout)
  la(result.stdout.trim() === version.trim(), 'different version reported',
    result.stdout, 'from input version to build', version)

  console.log('✅ using --version on the Cypress binary works')
}
