// store the cwd
const cwd = process.cwd()

const path = require('path')
const _ = require('lodash')
const os = require('os')
const simpleGit = require('simple-git')
const chalk = require('chalk')
const Promise = require('bluebird')
const minimist = require('minimist')
const la = require('lazy-ass')
const check = require('check-more-types')
const debug = require('debug')('cypress:binary')
const rp = require('@cypress/request-promise')

const zip = require('./zip')
const ask = require('./ask')
const meta = require('./meta')
const build = require('./build')
const upload = require('./upload')
const questionsRemain = require('./util/questions-remain')
const uploadUtils = require('./util/upload')
const { uploadArtifactToS3 } = require('./upload-build-artifact')
const { moveBinaries } = require('./move-binaries')
const { exec } = require('child_process')
const xvfb = require('../../cli/lib/exec/xvfb')
const smoke = require('./smoke')
const verify = require('../../cli/lib/tasks/verify')
const execa = require('execa')

const log = function (msg) {
  const time = new Date()
  const timeStamp = time.toLocaleTimeString()

  console.log(timeStamp, chalk.yellow(msg), chalk.blue(meta.PLATFORM))
}

const success = (str) => {
  return console.log(chalk.bgGreen(` ${chalk.black(str)} `))
}

const fail = (str) => {
  return console.log(chalk.bgRed(` ${chalk.black(str)} `))
}

const zippedFilename = () => upload.zipName

// goes through the list of properties and asks relevant question
// resolves with all relevant options set
// if the property already exists, skips the question
const askMissingOptions = function (properties = []) {
  const questions = {
    platform: ask.whichPlatform,
    version: ask.deployNewVersion,
    // note: zip file might not be absolute
    zip: ask.whichZipFile,
    commit: ask.toCommit,
  }
  const pickedQuestions = _.pick(questions, properties)

  return questionsRemain(pickedQuestions)
}

async function testExecutableVersion (buildAppExecutable, version) {
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

// hack for @packages/server modifying cwd
process.chdir(cwd)

const commitVersion = function (version) {
  const msg = `release ${version} [skip ci]`

  return simpleGit.commit(msg, {
    '--allow-empty': null,
  })
}

const deploy = {
  meta,

  parseOptions (argv) {
    const opts = minimist(argv, {
      alias: {
        zip: ['zipFile', 'zip-file', 'filename'],
      },
    })

    if (opts['skip-tests']) {
      opts.runTests = false
    }

    if (!opts.platform) opts.platform = os.platform()

    debug('parsed command line options')
    debug(opts)

    return opts
  },

  release () {
    // read off the argv
    const options = this.parseOptions(process.argv)

    const release = ({ version, commit }) => {
      return upload.s3Manifest(version)
      .then(() => {
        if (commit) {
          return commitVersion(version)
        }
      }).then(() => {
        return success('Release Complete')
      }).catch((err) => {
        fail('Release Failed')
        throw err
      })
      .then(() => {
        return this.checkDownloads({ version })
      })
    }

    return askMissingOptions(['version'])(options)
    .then(release)
  },

  checkDownloads ({ version }) {
    const systems = [
      { platform: 'linux', arch: 'x64' },
      { platform: 'linux', arch: 'arm64' },
      { platform: 'darwin', arch: 'x64' },
      { platform: 'darwin', arch: 'arm64' },
      { platform: 'win32', arch: 'x64' },
    ]

    const urlExists = (url) => {
      return rp.head(url)
      .then(() => true)
      .catch(() => false)
    }

    const checkSystem = ({ platform, arch }) => {
      const url = `https://download.cypress.io/desktop/${version}?platform=${platform}&arch=${arch}`
      const system = `${platform}-${arch}`

      process.stdout.write(`Checking for ${chalk.yellow(system)} at ${chalk.cyan(url)} ... `)

      return urlExists(url)
      .then((exists) => {
        const result = exists ? '✅' : '❌'

        process.stdout.write(`${result}\n`)

        return { exists, platform, arch, url }
      })
    }

    const allEnsured = (results) => {
      return !results.filter(({ exists }) => !exists).length
    }

    return Promise.mapSeries(systems, checkSystem)
    .then((results) => {
      if (allEnsured(results)) return results

      console.log(chalk.red(`\nCould not ensure v${version} of the Cypress binary is available for the following systems:`))

      return results
    })
    .map((result) => {
      const { exists, platform, arch, url } = result

      if (exists) return result

      console.log(`
  ${chalk.yellow('Platform')}: ${platform}
  ${chalk.yellow('Arch')}: ${arch}
  ${chalk.yellow('URL')}: ${url}`)

      return result
    })
    .then((results) => {
      if (allEnsured(results)) return

      const purgeCommand = `yarn binary-purge --version ${version}`
      const ensureCommand = `yarn binary-ensure --version ${version}`

      console.log(`\nPurge the cloudflare cache with ${chalk.yellow(purgeCommand)} and check again with ${chalk.yellow(ensureCommand)}\n`)

      process.exit(1)
    })
  },

  ensure () {
    const options = this.parseOptions(process.argv)

    return questionsRemain({ version: ask.getEnsureVersion })(options)
    .then(this.checkDownloads)
  },

  build (options) {
    console.log('#build')
    if (options == null) {
      options = this.parseOptions(process.argv)
    }

    debug('parsed build options %o', options)

    return askMissingOptions(['version', 'platform'])(options)
    .then(() => {
      console.log('building binary: platform %s version %s', options.platform, options.version)

      return build.buildCypressApp(options)
    })
  },

  package (options) {
    console.log('#package')
    if (options == null) {
      options = this.parseOptions(process.argv)
    }

    debug('parsed build options %o', options)

    return askMissingOptions(['version', 'platform'])(options)
    .then(() => {
      console.log('packaging binary: platform %s version %s', options.platform, options.version)

      return build.packageElectronApp(options)
    })
  },

  async smoke (options) {
    console.log('#smoke')

    if (options == null) {
      options = this.parseOptions(process.argv)
    }

    debug('parsed build options %o', options)

    await askMissingOptions(['version'])(options)

    // runSmokeTests
    let usingXvfb = xvfb.isNeeded()

    try {
      if (usingXvfb) {
        await xvfb.start()
      }

      log(`#testExecutableVersion ${meta.buildAppExecutable()}`)
      await testExecutableVersion(meta.buildAppExecutable(), options.version)

      const executablePath = meta.buildAppExecutable()

      await smoke.test(executablePath, meta.buildAppDir())
    } finally {
      if (usingXvfb) {
        await xvfb.stop()
      }
    }
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

  // upload Cypress binary or NPM Package zip file under unique hash
  'upload-build-artifact' (args = process.argv) {
    console.log('#uploadBuildArtifact')

    return uploadArtifactToS3(args)
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

      const uploadPath = upload.getFullUploadPath({
        version: options.version,
        platform: options.platform,
        name: upload.zipName,
      })

      return upload.toS3({
        file: options.zip,
        uploadPath,
      }).then(() => {
        return uploadUtils.purgeDesktopAppFromCache({
          version: options.version,
          platform: options.platform,
          zipName: options.zip,
        })
      })
    })
  },

  'move-binaries' (args = process.argv) {
    console.log('#moveBinaries')

    return moveBinaries(args)
  },

  // purge all URLs from Cloudflare cache from file
  'purge-urls' (args = process.argv) {
    console.log('#purge-urls')

    const options = minimist(args, {
      string: 'filePath',
      alias: {
        filePath: 'f',
      },
    })

    la(check.unemptyString(options.filePath), 'missing file path to url list', options)

    return uploadUtils.purgeUrlsFromCloudflareCache(options.filePath)
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

  async checkIfBinaryExistsOnCdn (args = process.argv) {
    console.log('#checkIfBinaryExistsOnCdn')

    const url = await uploadArtifactToS3([...args, '--dry-run', 'true'])

    console.log(`Checking if ${url} exists...`)

    const binaryExists = await rp.head(url)
    .then(() => true)
    .catch(() => false)

    if (binaryExists) {
      console.log('A binary was already built for this operating system and commit hash. Skipping binary build process...')
      exec('circleci-agent step halt', (_, __, stdout) => {
        console.log(stdout)
      })

      return
    }

    console.log('Binary does not yet exist. Continuing to build binary...')

    return binaryExists
  },
}

module.exports = _.bindAll(deploy, _.functions(deploy))
