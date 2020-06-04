// store the cwd
const cwd = process.cwd()

const path = require('path')
const _ = require('lodash')
const os = require('os')
const gift = require('gift')
const chalk = require('chalk')
const Promise = require('bluebird')
const minimist = require('minimist')
const la = require('lazy-ass')
const check = require('check-more-types')
const debug = require('debug')('cypress:binary')
const questionsRemain = require('@cypress/questions-remain')
const R = require('ramda')

const zip = require('./zip')
const ask = require('./ask')
const bump = require('./bump')
const meta = require('./meta')
const build = require('./build')
const upload = require('./upload')
const uploadUtils = require('./util/upload')
const { uploadNpmPackage } = require('./upload-npm-package')
const { uploadUniqueBinary } = require('./upload-unique-binary')
const { moveBinaries } = require('./move-binaries')

// initialize on existing repo
const repo = Promise.promisifyAll(gift(cwd))

const success = (str) => {
  return console.log(chalk.bgGreen(` ${chalk.black(str)} `))
}

const fail = (str) => {
  return console.log(chalk.bgRed(` ${chalk.black(str)} `))
}

const zippedFilename = R.always(upload.zipName)

// goes through the list of properties and asks relevant question
// resolves with all relevant options set
// if the property already exists, skips the question
const askMissingOptions = function (properties = []) {
  const questions = {
    platform: ask.whichPlatform,
    version: ask.deployNewVersion,
    // note: zip file might not be absolute
    zip: ask.whichZipFile,
    nextVersion: ask.nextVersion,
    commit: ask.toCommit,
  }
  const pickedQuestions = _.pick(questions, properties)

  return questionsRemain(pickedQuestions)
}

// hack for @packages/server modifying cwd
process.chdir(cwd)

const commitVersion = function (version) {
  const msg = `release ${version} [skip ci]`

  return repo.commitAsync(msg, {
    'allow-empty': true,
  })
}

const deploy = {
  meta,

  parseOptions (argv) {
    const opts = minimist(argv, {
      boolean: ['skip-clean'],
      default: {
        'skip-clean': false,
      },
      alias: {
        skipClean: 'skip-clean',
        zip: ['zipFile', 'zip-file', 'filename'],
      },
    })

    if (opts['skip-tests']) {
      opts.runTests = false
    }

    if (!opts.platform && (os.platform() === meta.platforms.linux)) {
      // only can build Linux on Linux
      opts.platform = meta.platforms.linux
    }

    // windows aliases
    if ((opts.platform === 'win32') || (opts.platform === 'win') || (opts.platform === 'windows')) {
      opts.platform = meta.platforms.windows
    }

    if (!opts.platform && (os.platform() === meta.platforms.windows)) {
      // only can build Windows binary on Windows platform
      opts.platform = meta.platforms.windows
    }

    // be a little bit user-friendly and allow aliased values
    if (opts.platform === 'mac') {
      opts.platform = meta.platforms.darwin
    }

    debug('parsed command line options')
    debug(opts)

    return opts
  },

  bump () {
    return ask.whichBumpTask()
    .then((task) => {
      switch (task) {
        case 'run':
          return bump.runTestProjects()
        case 'version':
          return ask.whichVersion(meta.distDir(''))
          .then((v) => {
            return bump.version(v)
          })
        default:
          throw new Error('unknown task')
      }
    })
  },

  // sets environment variable on each CI provider
  // to NEXT version to build
  setNextVersion () {
    const options = this.parseOptions(process.argv)

    return askMissingOptions(['nextVersion'])(options)
    .then(({ nextVersion }) => {
      return bump.nextVersion(nextVersion)
    })
  },

  release () {
    // read off the argv
    const options = this.parseOptions(process.argv)

    const release = ({ version, commit, nextVersion }) => {
      return upload.s3Manifest(version)
      .then(() => {
        if (commit) {
          return commitVersion(version)
        }
      }).then(() => {
        return bump.nextVersion(nextVersion)
      }).then(() => {
        return success('Release Complete')
      }).catch((err) => {
        fail('Release Failed')
        throw err
      })
    }

    return askMissingOptions(['version', 'nextVersion'])(options)
    .then(release)
  },

  build (options) {
    console.log('#build')
    if (options == null) {
      options = this.parseOptions(process.argv)
    }

    debug('parsed build options %o', options)

    return askMissingOptions(['version', 'platform'])(options)
    .then(() => {
      debug('building binary: platform %s version %s', options.platform, options.version)

      return build(options.platform, options.version, options)
    })
  },

  zip (options) {
    console.log('#zip')
    if (!options) {
      options = this.parseOptions(process.argv)
    }

    return askMissingOptions(['platform'])(options)
    .then((options) => {
      const zipDir = meta.zipDir(options.platform)

      console.log('directory to zip %s', zipDir)
      options.zip = path.resolve(zippedFilename(options.platform))

      return zip.ditto(zipDir, options.zip)
    })
  },

  // upload Cypress NPM package file
  'upload-npm-package' (args = process.argv) {
    console.log('#packageUpload')

    return uploadNpmPackage(args)
  },

  // upload Cypress binary zip file under unique hash
  'upload-unique-binary' (args = process.argv) {
    console.log('#uniqueBinaryUpload')

    return uploadUniqueBinary(args)
  },

  // uploads a single built Cypress binary ZIP file
  // usually a binary is built on CI and is uploaded
  upload (options) {
    console.log('#upload')

    if (!options) {
      options = this.parseOptions(process.argv)
    }

    return askMissingOptions(['version', 'platform', 'zip'])(options)
    .then((options) => {
      la(check.unemptyString(options.zip),
        'missing zipped filename', options)

      options.zip = path.resolve(options.zip)

      return options
    }).then((options) => {
      console.log('Need to upload file %s', options.zip)
      console.log('for platform %s version %s',
        options.platform, options.version)

      return upload.toS3({
        zipFile: options.zip,
        version: options.version,
        platform: options.platform,
      })
    })
  },

  'move-binaries' (args = process.argv) {
    console.log('#moveBinaries')

    return moveBinaries(args)
  },

  // purge all platforms of a desktop app for specific version
  'purge-version' (args = process.argv) {
    console.log('#purge-version')
    const options = minimist(args, {
      string: 'version',
      alias: {
        version: 'v',
      },
    })

    la(check.unemptyString(options.version), 'missing app version to purge', options)

    return uploadUtils.purgeDesktopAppAllPlatforms(options.version, upload.zipName)
  },

  // goes through the entire pipeline:
  //   - build
  //   - zip
  //   - upload
  deploy () {
    const options = this.parseOptions(process.argv)

    return askMissingOptions(['version', 'platform'])(options)
    .then((options) => {
      return this.build(options)
      .then(() => {
        return this.zip(options)
      })
      // assumes options.zip contains the zipped filename
      .then(() => {
        return this.upload(options)
      })
    })
  },
}

module.exports = _.bindAll(deploy, _.functions(deploy))
