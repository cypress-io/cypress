/* eslint-disable no-console */

// this file is a little cypress test runner helper
// so that we can utilize our own monorepo when testing
// things like the driver, or desktop-gui, or reporter

require('@packages/coffee/register')

const _ = require('lodash')
const cp = require('child_process')
const path = require('path')
const minimist = require('minimist')
const Promise = require('bluebird')
const xvfb = require('../cli/lib/exec/xvfb')
const la = require('lazy-ass')
const is = require('check-more-types')
const fs = Promise.promisifyAll(require('fs-extra'))
const { existsSync } = require('fs')
const { basename } = require('path')

const humanTime = require('../packages/server/lib/util/human_time.coffee')

const glob = Promise.promisify(require('glob'))

const options = minimist(process.argv.slice(2))

const started = new Date()

let numFailed = 0

// turn this back on for driver + desktop gui tests
// TODO how does this work?! I don't see where the copying can possible happen
process.env.COPY_CIRCLE_ARTIFACTS = 'true'

const isCircle = process.env.CI === 'true' && process.env.CIRCLECI === 'true'

// matches the value in circle.yml "store_artifacts" command
const artifactsFolder = '/tmp/artifacts'

// let us pass in project or resolve it to process.cwd() and dir
options.project = options.project || path.resolve(process.cwd(), options.dir || '')
console.log('options.project', options.project)

const prepareArtifactsFolder = () => {
  if (!isCircle) {
    return Promise.resolve()
  }
  console.log('Making folder %s', artifactsFolder)
  return fs.ensureDirAsync(artifactsFolder)
}

const fileExists = (name) => Promise.resolve(existsSync(name))

const copyScreenshots = (name) => () => {
  la(is.unemptyString(name), 'missing name', name)

  const screenshots = path.join(options.project, 'cypress', 'screenshots')
  return fileExists(screenshots)
  .then((exists) => {
    if (!exists) {
      return
    }

    console.log('Copying screenshots for %s from %s', name, screenshots)
    const destination = path.join(artifactsFolder, name)

    return fs.ensureDirAsync(destination)
    .then(() =>
      fs.copyAsync(screenshots, destination, {
        overwrite: true,
      })
    )
  })
}

const copyVideos = (name) => () => {
  const videos = path.join(options.project, 'cypress', 'videos')
  return fileExists(videos)
  .then((exists) => {
    if (!exists) {
      return
    }

    console.log('Copying videos for %s from %s', name, videos)
    const destination = path.join(artifactsFolder, name)
    return fs.ensureDirAsync(destination)
    .then(() =>
      fs.copyAsync(videos, destination, {
        overwrite: true,
      })
    )
  })
}

/**
 * Copies artifacts (screenshots, videos) if configured into a subfolder
 *
 * @param {string} name Spec base name
 */
const copyArtifacts = (name) => () => {
  if (!isCircle) {
    return Promise.resolve()
  }
  return copyScreenshots(name)().then(copyVideos(name))
}

function isLoadBalanced (options) {
  return _.isNumber(options.index) && _.isNumber(options.parallel)
}

function spawn (cmd, args, opts) {
  return new Promise((resolve, reject) => {
    cp.spawn(cmd, args, opts)
    .on('exit', resolve)
    .on('error', reject)
  })
}

_.defaults(options, {
  dir: '',
  glob: 'cypress/integration/**/*',
})

// normalize and set to absolute path based on process.cwd
options.glob = path.resolve(options.project, options.glob)

const runSpec = (spec) => {
  console.log('\nRunning spec', spec)
  la(is.unemptyString(spec), 'missing spec filename', spec)

  // get the path to xvfb-maybe binary
  // const cmd = path.join(__dirname, '..', 'node_modules', '.bin', 'xvfb-maybe')

  const configFile = path.join(__dirname, '..', 'mocha-reporter-config.json')

  const args = [
    // '-as',
    // '\"-screen 0 1280x720x16\"',
    // '--',
    // 'node',
    path.resolve('..', '..', 'scripts', 'start.js'), // launch root monorepo start
    '--run-project',
    options.project,
    '--spec',
    spec,
    '--reporter',
    path.resolve(__dirname, '..', 'node_modules', 'mocha-multi-reporters'),
    '--reporter-options',
    `configFile=${configFile}`,
  ]

  if (options.browser) {
    args.push('--browser', options.browser)
  }

  return spawn('node', args, { stdio: 'inherit' })
  .then((code) => {
    console.log(`${spec} exited with code`, code)

    numFailed += code
  })
  .then(copyArtifacts(basename(spec)))
  .catch((err) => {
    console.log(err)
    throw err
  })
}

function run () {
  console.log('Specs found:')

  return glob(options.glob, {
    nodir: true,
    realpath: true,
  })
  .tap(prepareArtifactsFolder)
  .then((specs = []) => {
    if (options.spec) {
      return _.filter(specs, (spec) => {
        return spec.includes(options.spec)
      })
    }

    if (isLoadBalanced(options)) {
      // take the total number of specs and divide by our
      // total number of parallel nodes, ceiling the number
      const size = Math.ceil(specs.length / options.parallel)

      // chunk the specs by the total nodes
      // and then just grab this index's specs
      return _.chunk(specs, size)[options.index]
    }

    return specs
  })
  .tap(console.log)
  .each(runSpec)
  .then(() => {
    const duration = new Date() - started

    console.log('')
    console.log('Total duration:', humanTime.long(duration))
    console.log('Exiting with final code:', numFailed)

    process.exit(numFailed)
  })
}

const needsXvfb = xvfb.isNeeded()

if (needsXvfb) {
  return xvfb.start()
  .then(run)
  .finally(xvfb.stop)
} else {
  return run()
}
