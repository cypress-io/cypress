const _ = require('lodash')
let fs = require('fs-extra')
const path = require('path')
// we wrap glob to handle EMFILE error
let glob = require('glob')
const Promise = require('bluebird')
const retry = require('bluebird-retry')
const la = require('lazy-ass')
const check = require('check-more-types')
const execa = require('execa')
const R = require('ramda')
const os = require('os')
const prettyMs = require('pretty-ms')
const pluralize = require('pluralize')
const debug = require('debug')('cypress:binary')
const externalUtils = require('./3rd-party')

fs = Promise.promisifyAll(fs)
glob = Promise.promisify(glob)

const DEFAULT_PATHS = 'package.json'.split(' ')

const pathToPackageJson = function (packageFolder) {
  la(check.unemptyString(packageFolder), 'expected package path', packageFolder)

  return path.join(packageFolder, 'package.json')
}

const createCLIExecutable = (command) => {
  return (function (args, cwd, env = {}) {
    const commandToExecute = `${command} ${args.join(' ')}`

    console.log(commandToExecute)
    if (cwd) {
      console.log('in folder:', cwd)
    }

    la(check.maybe.string(cwd), 'invalid CWD string', cwd)

    return execa(command, args, { stdio: 'inherit', cwd, env })
    // if everything is ok, resolve with nothing
    .then(R.always(undefined))
    .catch((result) => {
      const msg = `${commandToExecute} failed with exit code: ${result.code}`

      throw new Error(msg)
    })
  })
}

const yarn = createCLIExecutable('yarn')
const npx = createCLIExecutable('npx')

const runAllBuild = _.partial(npx, ['lerna', 'run', 'build-prod', '--ignore', 'cli'])

// removes transpiled JS files in the original package folders
const runAllCleanJs = _.partial(npx, ['lerna', 'run', 'clean-js', '--ignore', 'cli'])

// @returns string[] with names of packages, e.g. ['runner', 'driver', 'server']
const getPackagesWithScript = (scriptName) => {
  return Promise.resolve(glob('./packages/*/package.json'))
  .map((pkgPath) => {
    return fs.readJsonAsync(pkgPath)
    .then((json) => {
      if (json.scripts != null ? json.scripts.build : undefined) {
        return path.basename(path.dirname(pkgPath))
      }
    })
  }).filter(Boolean)
}

const copyAllToDist = function (distDir) {
  const copyRelativePathToDist = function (relative) {
    const dest = path.join(distDir, relative)

    return retry(() => {
      console.log(relative, '->', dest)

      return fs.copyAsync(relative, dest)
    })
  }

  const copyPackage = function (pkg) {
    console.log('** copy package: %s **', pkg)

    // copies the package to dist
    // including the default paths
    // and any specified in package.json files
    return Promise.resolve(fs.readJsonAsync(pathToPackageJson(pkg)))
    .then((json) => {
      // grab all the files that match "files" wildcards
      // but without all negated files ("!src/**/*.spec.js" for example)
      // and default included paths
      // and convert to relative paths
      return DEFAULT_PATHS
      .concat(json.files || [])
      .concat(json.main || [])
    }).then((pkgFileMasks) => {
      debug('for pkg %s have the following file masks %o', pkg, pkgFileMasks)
      const globOptions = {
        cwd: pkg, // search in the package folder
        absolute: false, // and return relative file paths
        followSymbolicLinks: false, // do not follow symlinks
      }

      return externalUtils.globby(pkgFileMasks, globOptions)
    }).map((foundFileRelativeToPackageFolder) => {
      return path.join(pkg, foundFileRelativeToPackageFolder)
    })
    .tap(debug)
    .map(copyRelativePathToDist, { concurrency: 1 })
  }

  // fs-extra concurrency tests (copyPackage / copyRelativePathToDist)
  // 1/1  41688
  // 1/5  42218
  // 1/10 42566
  // 2/1  45041
  // 2/2  43589
  // 3/3  51399

  // cp -R concurrency tests
  // 1/1 65811

  const started = new Date()

  return fs.ensureDirAsync(distDir)
  .then(() => {
    return glob('./packages/*')
    .map(copyPackage, { concurrency: 1 })
  }).then(() => {
    console.log('Finished Copying %dms', new Date() - started)

    return console.log('')
  })
}

const forceNpmInstall = function (packagePath, packageToInstall) {
  console.log('Force installing %s', packageToInstall)
  console.log('in %s', packagePath)
  la(check.unemptyString(packageToInstall), 'missing package to install')

  return yarn(['install', '--force', packageToInstall], packagePath)
}

const removeDevDependencies = function (packageFolder) {
  const packagePath = pathToPackageJson(packageFolder)

  console.log('removing devDependencies from %s', packagePath)

  return fs.readJsonAsync(packagePath)
  .then((json) => {
    delete json.devDependencies

    return fs.writeJsonAsync(packagePath, json, { spaces: 2 })
  })
}

const retryGlobbing = function (pathToPackages, delay = 1000) {
  const retryGlob = () => {
    return glob(pathToPackages)
    .catch({ code: 'EMFILE' }, () => {
      // wait, then retry
      return Promise
      .delay(delay)
      .then(retryGlob)
    })
  }

  return retryGlob()
}

// installs all packages given a wildcard
// pathToPackages would be something like "C:\projects\cypress\dist\win32\packages\*"
const npmInstallAll = function (pathToPackages) {
  console.log(`npmInstallAll packages in ${pathToPackages}`)

  const started = new Date()

  const retryNpmInstall = function (pkg) {
    console.log('installing %s', pkg)
    console.log('NODE_ENV is %s', process.env.NODE_ENV)

    // force installing only PRODUCTION dependencies
    // https://docs.npmjs.com/cli/install
    const npmInstall = _.partial(yarn, ['install', '--production'])

    return npmInstall(pkg, { NODE_ENV: 'production' })
    .catch({ code: 'EMFILE' }, () => {
      return Promise
      .delay(1000)
      .then(() => {
        return retryNpmInstall(pkg)
      })
    }).catch((err) => {
      console.log(err, err.code)
      throw err
    })
  }

  const printFolders = (folders) => {
    return console.log('found %s', pluralize('folder', folders.length, true))
  }

  // only installs production dependencies
  return retryGlobbing(pathToPackages)
  .tap(printFolders)
  .mapSeries((packageFolder) => {
    return removeDevDependencies(packageFolder)
    .then(() => {
      return retryNpmInstall(packageFolder)
    })
  }).then(() => {
    const end = new Date()

    return console.log('Finished NPM Installing', prettyMs(end - started))
  })
}

const removePackageJson = function (filename) {
  if (filename.endsWith('/package.json')) {
    return path.dirname(filename)
  }

  return filename
}

const ensureFoundSomething = function (files) {
  if (files.length === 0) {
    throw new Error('Could not find any files')
  }

  return files
}

const symlinkType = function () {
  if (os.platform() === 'win32') {
    return 'junction'
  }

  return 'dir'
}

const symlinkAll = function (pathToDistPackages, pathTo) {
  console.log('symlink these packages', pathToDistPackages)
  la(check.unemptyString(pathToDistPackages),
    'missing paths to dist packages', pathToDistPackages)

  const symlink = function (pkg) {
    // console.log(pkg, dist)
    // strip off the initial './'
    // ./packages/foo -> node_modules/@packages/foo
    pkg = removePackageJson(pkg)
    const dest = pathTo('node_modules', '@packages', path.basename(pkg))
    const relativeDest = path.relative(`${dest}/..`, pkg)

    const type = symlinkType()

    console.log(relativeDest, 'link ->', dest, 'type', type)

    return fs.ensureSymlinkAsync(relativeDest, dest, symlinkType)
    .catch((err) => {
      if (!err.message.includes('EEXIST')) {
        throw err
      }
    })
  }

  return glob(pathToDistPackages)
  .then(ensureFoundSomething)
  .map(symlink)
}

module.exports = {
  runAllBuild,

  copyAllToDist,

  npmInstallAll,

  symlinkAll,

  runAllCleanJs,

  forceNpmInstall,

  getPackagesWithScript,
}

if (!module.parent) {
  console.log('demo force install')
  forceNpmInstall('packages/server', '@ffmpeg-installer/win32-x64')
}
