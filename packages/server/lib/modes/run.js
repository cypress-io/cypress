/* eslint-disable no-console, @cypress/dev/arrow-body-multiline-braces  */
const _ = require('lodash')
const la = require('lazy-ass')
const pkg = require('@packages/root')
const path = require('path')
const chalk = require('chalk')
const human = require('human-interval')
const debug = require('debug')('cypress:server:run')
const Promise = require('bluebird')
const logSymbols = require('log-symbols')

const recordMode = require('./record')
const errors = require('../errors')
const Project = require('../project')
const Reporter = require('../reporter')
const browserUtils = require('../browsers')
const openProject = require('../open_project')
const videoCapture = require('../video_capture')
const fs = require('../util/fs')
const env = require('../util/env')
const trash = require('../util/trash')
const random = require('../util/random')
const system = require('../util/system')
const duration = require('../util/duration')
const newlines = require('../util/newlines')
const terminal = require('../util/terminal')
const specsUtil = require('../util/specs')
const humanTime = require('../util/human_time')
const electronApp = require('../util/electron-app')
const settings = require('../util/settings')
const chromePolicyCheck = require('../util/chrome_policy_check')
const experiments = require('../experiments')
const objUtils = require('../util/obj_utils')

const DELAY_TO_LET_VIDEO_FINISH_MS = 1000

const color = (val, c) => {
  return chalk[c](val)
}

const gray = (val) => {
  return color(val, 'gray')
}

const colorIf = function (val, c) {
  if (val === 0) {
    val = '-'
    c = 'gray'
  }

  return color(val, c)
}

const getSymbol = function (num) {
  if (num) {
    return logSymbols.error
  }

  return logSymbols.success
}

const getWidth = (table, index) => {
  // get the true width of a table's column,
  // based off of calculated table options for that column
  const columnWidth = table.options.colWidths[index]

  if (columnWidth) {
    return columnWidth - (table.options.style['padding-left'] + table.options.style['padding-right'])
  }
}

const formatBrowser = (browser) => {
  // TODO: finish browser
  return _.compact([
    browser.displayName,
    browser.majorVersion,
    browser.isHeadless && gray('(headless)'),
  ]).join(' ')
}

const formatFooterSummary = (results) => {
  const { totalFailed, runs } = results

  // pass or fail color
  const c = totalFailed ? 'red' : 'green'

  const phrase = (() => {
    // if we have any specs failing...
    if (!totalFailed) {
      return 'All specs passed!'
    }

    // number of specs
    const total = runs.length
    const failingRuns = _.filter(runs, 'stats.failures').length
    const percent = Math.round((failingRuns / total) * 100)

    return `${failingRuns} of ${total} failed (${percent}%)`
  })()

  return [
    formatSymbolSummary(totalFailed),
    color(phrase, c),
    gray(duration.format(results.totalDuration)),
    colorIf(results.totalTests, 'reset'),
    colorIf(results.totalPassed, 'green'),
    colorIf(totalFailed, 'red'),
    colorIf(results.totalPending, 'cyan'),
    colorIf(results.totalSkipped, 'blue'),
  ]
}

const formatSymbolSummary = (failures) => {
  return getSymbol(failures)
}

const formatPath = (name, n, colour = 'reset') => {
  if (!name) return ''

  const fakeCwdPath = env.get('FAKE_CWD_PATH')

  if (fakeCwdPath && env.get('CYPRESS_INTERNAL_ENV') === 'test') {
    // if we're testing within Cypress, we want to strip out
    // the current working directory before calculating the stdout tables
    // this will keep our snapshots consistent everytime we run
    const cwdPath = process.cwd()

    name = name
    .split(cwdPath)
    .join(fakeCwdPath)
  }

  // add newLines at each n char and colorize the path
  if (n) {
    let nameWithNewLines = newlines.addNewlineAtEveryNChar(name, n)

    return `${color(nameWithNewLines, colour)}`
  }

  return `${color(name, colour)}`
}

const formatNodeVersion = ({ resolvedNodeVersion, resolvedNodePath }, width) => {
  debug('formatting Node version. %o', { version: resolvedNodeVersion, path: resolvedNodePath })

  if (resolvedNodePath) {
    return formatPath(`v${resolvedNodeVersion} (${resolvedNodePath})`, width)
  }
}

const formatRecordParams = function (runUrl, parallel, group, tag) {
  if (runUrl) {
    if (!group) {
      group = false
    }

    if (!tag) {
      tag = false
    }

    return `Tag: ${tag}, Group: ${group}, Parallel: ${Boolean(parallel)}`
  }
}

const displayRunStarting = function (options = {}) {
  const { browser, config, group, parallel, runUrl, specPattern, specs, tag } = options

  console.log('')

  terminal.divider('=')

  console.log('')

  terminal.header('Run Starting', {
    color: ['reset'],
  })

  console.log('')

  const experimental = experiments.getExperimentsFromResolved(config.resolved)
  const enabledExperiments = _.pickBy(experimental, _.property('enabled'))
  const hasExperiments = !_.isEmpty(enabledExperiments)

  // if we show Node Version, then increase 1st column width
  // to include wider 'Node Version:'.
  // Without Node version, need to account for possible "Experiments" label
  const colWidths = config.resolvedNodePath ? [16, 84] : (
    hasExperiments ? [14, 86] : [12, 88]
  )

  const table = terminal.table({
    colWidths,
    type: 'outsideBorder',
  })

  const formatSpecPattern = () => {
    // foo.spec.js, bar.spec.js, baz.spec.js
    // also inserts newlines at col width
    if (specPattern) {
      return formatPath(specPattern.join(', '), getWidth(table, 1))
    }
  }

  const formatSpecs = (specs) => {
    // 25 found: (foo.spec.js, bar.spec.js, baz.spec.js)
    const names = _.map(specs, 'name')
    const specsTruncated = _.truncate(names.join(', '), { length: 250 })

    const stringifiedSpecs = [
      `${names.length} found `,
      '(',
      specsTruncated,
      ')',
    ]
    .join('')

    return formatPath(stringifiedSpecs, getWidth(table, 1))
  }

  const data = _
  .chain([
    [gray('Cypress:'), pkg.version],
    [gray('Browser:'), formatBrowser(browser)],
    [gray('Node Version:'), formatNodeVersion(config, getWidth(table, 1))],
    [gray('Specs:'), formatSpecs(specs)],
    [gray('Searched:'), formatSpecPattern(specPattern)],
    [gray('Params:'), formatRecordParams(runUrl, parallel, group, tag)],
    [gray('Run URL:'), runUrl ? formatPath(runUrl, getWidth(table, 1)) : ''],
    [gray('Experiments:'), hasExperiments ? experiments.formatExperiments(enabledExperiments) : ''],
  ])
  .filter(_.property(1))
  .value()

  table.push(...data)

  const heading = table.toString()

  console.log(heading)

  console.log('')

  return heading
}

const displaySpecHeader = function (name, curr, total, estimated) {
  console.log('')

  const PADDING = 2

  const table = terminal.table({
    colWidths: [10, 70, 20],
    colAligns: ['left', 'left', 'right'],
    type: 'pageDivider',
    style: {
      'padding-left': PADDING,
      'padding-right': 0,
    },
  })

  table.push(['', ''])
  table.push([
    'Running:',
    `${formatPath(name, getWidth(table, 1), 'gray')}`,
    gray(`(${curr} of ${total})`),
  ])

  console.log(table.toString())

  if (estimated) {
    const estimatedLabel = `${' '.repeat(PADDING)}Estimated:`

    return console.log(estimatedLabel, gray(humanTime.long(estimated)))
  }
}

const collectTestResults = (obj = {}, estimated) => {
  return {
    name: _.get(obj, 'spec.name'),
    tests: _.get(obj, 'stats.tests'),
    passes: _.get(obj, 'stats.passes'),
    pending: _.get(obj, 'stats.pending'),
    failures: _.get(obj, 'stats.failures'),
    skipped: _.get(obj, 'stats.skipped'),
    duration: humanTime.long(_.get(obj, 'stats.wallClockDuration')),
    estimated: estimated && humanTime.long(estimated),
    screenshots: obj.screenshots && obj.screenshots.length,
    video: Boolean(obj.video),
  }
}

const renderSummaryTable = (runUrl) => {
  return function (results) {
    const { runs } = results

    console.log('')

    terminal.divider('=')

    console.log('')

    terminal.header('Run Finished', {
      color: ['reset'],
    })

    if (runs && runs.length) {
      const colAligns = ['left', 'left', 'right', 'right', 'right', 'right', 'right', 'right']
      const colWidths = [3, 41, 11, 9, 9, 9, 9, 9]

      const table1 = terminal.table({
        colAligns,
        colWidths,
        type: 'noBorder',
        head: [
          '',
          gray('Spec'),
          '',
          gray('Tests'),
          gray('Passing'),
          gray('Failing'),
          gray('Pending'),
          gray('Skipped'),
        ],
      })

      const table2 = terminal.table({
        colAligns,
        colWidths,
        type: 'border',
      })

      const table3 = terminal.table({
        colAligns,
        colWidths,
        type: 'noBorder',
        head: formatFooterSummary(results),
      })

      _.each(runs, (run) => {
        const { spec, stats } = run

        const ms = duration.format(stats.wallClockDuration)

        return table2.push([
          formatSymbolSummary(stats.failures),
          formatPath(spec.name, getWidth(table2, 1)),
          color(ms, 'gray'),
          colorIf(stats.tests, 'reset'),
          colorIf(stats.passes, 'green'),
          colorIf(stats.failures, 'red'),
          colorIf(stats.pending, 'cyan'),
          colorIf(stats.skipped, 'blue'),
        ])
      })

      console.log('')
      console.log('')
      console.log(terminal.renderTables(table1, table2, table3))
      console.log('')

      if (runUrl) {
        console.log('')

        const table4 = terminal.table({
          colWidths: [100],
          type: 'pageDivider',
          style: {
            'padding-left': 2,
          },
        })

        table4.push(['', ''])
        table4.push([`Recorded Run: ${formatPath(runUrl, getWidth(table4, 0), 'gray')}`])

        console.log(terminal.renderTables(table4))

        console.log('')
      }
    }
  }
}

const iterateThroughSpecs = function (options = {}) {
  const { specs, runEachSpec, parallel, beforeSpecRun, afterSpecRun, config } = options

  const serial = () => {
    return Promise.mapSeries(specs, runEachSpec)
  }

  const serialWithRecord = () => {
    return Promise
    .mapSeries(specs, (spec, index, length) => {
      return beforeSpecRun(spec)
      .then(({ estimated }) => {
        return runEachSpec(spec, index, length, estimated)
      })
      .tap((results) => {
        return afterSpecRun(spec, results, config)
      })
    })
  }

  const parallelWithRecord = (runs) => {
    return beforeSpecRun()
    .then(({ spec, claimedInstances, totalInstances, estimated }) => {
      // no more specs to run?
      if (!spec) {
        // then we're done!
        return runs
      }

      // find the actual spec object amongst
      // our specs array since the API sends us
      // the relative name
      spec = _.find(specs, { relative: spec })

      return runEachSpec(
        spec,
        claimedInstances - 1,
        totalInstances,
        estimated,
      )
      .tap((results) => {
        runs.push(results)

        return afterSpecRun(spec, results, config)
      })
      .then(() => {
        // recurse
        return parallelWithRecord(runs)
      })
    })
  }

  if (parallel) {
    // if we are running in parallel
    // then ask the server for the next spec
    return parallelWithRecord([])
  }

  if (beforeSpecRun) {
    // else iterate serialially and record
    // the results of each spec
    return serialWithRecord()
  }

  // else iterate in serial
  return serial()
}

const getProjectId = Promise.method((project, id) => {
  if (id == null) {
    id = env.get('CYPRESS_PROJECT_ID')
  }

  // if we have an ID just use it
  if (id) {
    return id
  }

  return project.getProjectId()
  .catch(() => {
    // no id no problem
    return null
  })
})

const getDefaultBrowserOptsByFamily = (browser, project, writeVideoFrame, onError) => {
  la(browserUtils.isBrowserFamily(browser.family), 'invalid browser family in', browser)

  if (browser.name === 'electron') {
    return getElectronProps(browser.isHeaded, writeVideoFrame, onError)
  }

  if (browser.family === 'chromium') {
    return getChromeProps(writeVideoFrame)
  }

  if (browser.family === 'firefox') {
    return getFirefoxProps(project, writeVideoFrame)
  }

  return {}
}

const getFirefoxProps = (project, writeVideoFrame) => {
  debug('setting Firefox properties')

  return _
  .chain({})
  .tap((props) => {
    if (writeVideoFrame) {
      const onScreencastFrame = (data) => {
        writeVideoFrame(data)
      }

      project.on('capture:video:frames', onScreencastFrame)

      props.onScreencastFrame = true
    }
  })
  .value()
}

const getCdpVideoPropSetter = (writeVideoFrame) => {
  if (!writeVideoFrame) {
    return _.noop
  }

  return (props) => {
    props.onScreencastFrame = (e) => {
      // https://chromedevtools.github.io/devtools-protocol/tot/Page#event-screencastFrame
      writeVideoFrame(Buffer.from(e.data, 'base64'))
    }
  }
}

const getChromeProps = (writeVideoFrame) => {
  const shouldWriteVideo = Boolean(writeVideoFrame)

  debug('setting Chrome properties %o', { shouldWriteVideo })

  return _
  .chain({})
  .tap(getCdpVideoPropSetter(writeVideoFrame))
  .value()
}

const getElectronProps = (isHeaded, writeVideoFrame, onError) => {
  return _
  .chain({
    width: 1280,
    height: 720,
    show: isHeaded,
    onCrashed () {
      const err = errors.get('RENDERER_CRASHED')

      errors.log(err)

      onError(err)
    },
    onNewWindow (e, url, frameName, disposition, options) {
      // force new windows to automatically open with show: false
      // this prevents window.open inside of javascript client code
      // to cause a new BrowserWindow instance to open
      // https://github.com/cypress-io/cypress/issues/123
      options.show = false
    },
  })
  .tap(getCdpVideoPropSetter(writeVideoFrame))
  .value()
}

const sumByProp = (runs, prop) => {
  return _.sumBy(runs, prop) || 0
}

const getRun = (run, prop) => {
  return _.get(run, prop)
}

const writeOutput = (outputPath, results) => {
  return Promise.try(() => {
    if (!outputPath) {
      return
    }

    debug('saving output results %o', { outputPath })

    return fs.outputJsonAsync(outputPath, results)
  })
}

const onWarning = (err) => {
  console.log(chalk.yellow(err.message))
}

const openProjectCreate = (projectRoot, socketId, args) => {
  // now open the project to boot the server
  // putting our web client app in headless mode
  // - NO  display server logs (via morgan)
  // - YES display reporter results (via mocha reporter)
  const options = {
    socketId,
    morgan: false,
    report: true,
    isTextTerminal: args.isTextTerminal,
    // pass the list of browsers we have detected when opening a project
    // to give user's plugins file a chance to change it
    browsers: args.browsers,
    onWarning,
    onError: args.onError,
  }

  return openProject
  .create(projectRoot, args, options)
  .catch({ portInUse: true }, (err) => {
    // TODO: this needs to move to call exitEarly
    // so we record the failure in CI
    return errors.throw('PORT_IN_USE_LONG', err.port)
  })
}

const createAndOpenProject = function (socketId, options) {
  const { projectRoot, projectId } = options

  return Project
  .ensureExists(projectRoot, options)
  .then(() => {
    // open this project without
    // adding it to the global cache
    return openProjectCreate(projectRoot, socketId, options)
  })
  .call('getProject')
  .then((project) => {
    return Promise.props({
      project,
      config: project.getConfig(),
      projectId: getProjectId(project, projectId),
    })
  })
}

const removeOldProfiles = (browser) => {
  return browserUtils.removeOldProfiles(browser)
  .catch((err) => {
    // dont make removing old browsers profiles break the build
    return errors.warning('CANNOT_REMOVE_OLD_BROWSER_PROFILES', err.stack)
  })
}

const trashAssets = Promise.method((config = {}) => {
  if (config.trashAssetsBeforeRuns !== true) {
    return
  }

  return Promise.join(
    trash.folder(config.videosFolder),
    trash.folder(config.screenshotsFolder),
  )
  .catch((err) => {
    // dont make trashing assets fail the build
    return errors.warning('CANNOT_TRASH_ASSETS', err.stack)
  })
})

const createVideoRecording = function (videoName, options = {}) {
  const outputDir = path.dirname(videoName)

  const onError = _.once((err) => {
    // catch video recording failures and log them out
    // but don't let this affect the run at all
    return errors.warning('VIDEO_RECORDING_FAILED', err.stack)
  })

  return fs
  .ensureDirAsync(outputDir)
  .catch(onError)
  .then(() => {
    return videoCapture
    .start(videoName, _.extend({}, options, { onError }))
  })
}

const getVideoRecordingDelay = function (startedVideoCapture) {
  if (startedVideoCapture) {
    return DELAY_TO_LET_VIDEO_FINISH_MS
  }

  return 0
}

const maybeStartVideoRecording = Promise.method(function (options = {}) {
  const { spec, browser, video, videosFolder } = options

  debug(`video recording has been ${video ? 'enabled' : 'disabled'}. video: %s`, video)
  // bail if we've been told not to capture
  // a video recording
  if (!video) {
    return
  }

  // make sure we have a videosFolder
  if (!videosFolder) {
    throw new Error('Missing videoFolder for recording')
  }

  const videoPath = (suffix) => {
    return path.join(videosFolder, spec.name + suffix)
  }

  const videoName = videoPath('.mp4')
  const compressedVideoName = videoPath('-compressed.mp4')

  return this.createVideoRecording(videoName, { webmInput: browser.family === 'firefox' })
  .then((props = {}) => {
    return {
      videoName,
      compressedVideoName,
      endVideoCapture: props.endVideoCapture,
      writeVideoFrame: props.writeVideoFrame,
      startedVideoCapture: props.startedVideoCapture,
    }
  })
})

const warnVideoRecordingFailed = (err) => {
  // log that post processing was attempted
  // but failed and dont let this change the run exit code
  errors.warning('VIDEO_POST_PROCESSING_FAILED', err.stack)
}

module.exports = {
  collectTestResults,

  getProjectId,

  writeOutput,

  openProjectCreate,

  createVideoRecording,

  getVideoRecordingDelay,

  maybeStartVideoRecording,

  getChromeProps,

  getElectronProps,

  displayRunStarting,

  exitEarly (err) {
    debug('set early exit error: %s', err.stack)

    this.earlyExitErr = err
  },

  displayResults (obj = {}, estimated) {
    const results = collectTestResults(obj, estimated)

    const c = results.failures ? 'red' : 'green'

    console.log('')

    terminal.header('Results', {
      color: [c],
    })

    const table = terminal.table({
      colWidths: [14, 86],
      type: 'outsideBorder',
    })

    const data = _.chain([
      ['Tests:', results.tests],
      ['Passing:', results.passes],
      ['Failing:', results.failures],
      ['Pending:', results.pending],
      ['Skipped:', results.skipped],
      ['Screenshots:', results.screenshots],
      ['Video:', results.video],
      ['Duration:', results.duration],
      estimated ? ['Estimated:', results.estimated] : undefined,
      ['Spec Ran:', formatPath(results.name, getWidth(table, 1), c)],
    ])
    .compact()
    .map((arr) => {
      const [key, val] = arr

      return [color(key, 'gray'), color(val, c)]
    })
    .value()

    table.push(...data)

    console.log('')
    console.log(table.toString())
    console.log('')
  },

  displayScreenshots (screenshots = []) {
    console.log('')

    terminal.header('Screenshots', { color: ['yellow'] })

    console.log('')

    const table = terminal.table({
      colWidths: [3, 82, 15],
      colAligns: ['left', 'left', 'right'],
      type: 'noBorder',
      style: {
        'padding-right': 0,
      },
      chars: {
        'left': ' ',
        'right': '',
      },
    })

    screenshots.forEach((screenshot) => {
      const dimensions = gray(`(${screenshot.width}x${screenshot.height})`)

      table.push([
        '-',
        formatPath(`${screenshot.path}`, getWidth(table, 1)),
        gray(dimensions),
      ])
    })

    console.log(table.toString())

    console.log('')
  },

  async postProcessRecording (name, cname, videoCompression, shouldUploadVideo, quiet, ffmpegChaptersConfig) {
    debug('ending the video recording %o', { name, videoCompression, shouldUploadVideo })

    // once this ended promises resolves
    // then begin processing the file
    // dont process anything if videoCompress is off
    // or we've been told not to upload the video
    if (videoCompression === false || shouldUploadVideo === false) {
      return
    }

    function continueProcessing (onProgress = undefined) {
      return videoCapture.process(name, cname, videoCompression, ffmpegChaptersConfig, onProgress)
    }

    if (quiet) {
      return continueProcessing()
    }

    console.log('')

    terminal.header('Video', {
      color: ['cyan'],
    })

    console.log('')

    const table = terminal.table({
      colWidths: [3, 21, 76],
      colAligns: ['left', 'left', 'left'],
      type: 'noBorder',
      style: {
        'padding-right': 0,
      },
      chars: {
        'left': ' ',
        'right': '',
      },
    })

    table.push([
      gray('-'),
      gray('Started processing:'),
      chalk.cyan(`Compressing to ${videoCompression} CRF`),
    ])

    console.log(table.toString())

    const started = Date.now()
    let progress = Date.now()
    const throttle = env.get('VIDEO_COMPRESSION_THROTTLE') || human('10 seconds')

    const onProgress = function (float) {
      if (float === 1) {
        const finished = Date.now() - started
        const dur = `(${humanTime.long(finished)})`

        const table = terminal.table({
          colWidths: [3, 21, 61, 15],
          colAligns: ['left', 'left', 'left', 'right'],
          type: 'noBorder',
          style: {
            'padding-right': 0,
          },
          chars: {
            'left': ' ',
            'right': '',
          },
        })

        table.push([
          gray('-'),
          gray('Finished processing:'),
          `${formatPath(name, getWidth(table, 2), 'cyan')}`,
          gray(dur),
        ])

        console.log(table.toString())

        console.log('')
      }

      if (Date.now() - progress > throttle) {
        // bump up the progress so we dont
        // continuously get notifications
        progress += throttle
        const percentage = `${Math.ceil(float * 100)}%`

        console.log('    Compression progress: ', chalk.cyan(percentage))
      }
    }

    return continueProcessing(onProgress)
  },

  launchBrowser (options = {}) {
    const { browser, spec, writeVideoFrame, project, screenshots, projectRoot, onError } = options

    const browserOpts = getDefaultBrowserOptsByFamily(browser, project, writeVideoFrame, onError)

    browserOpts.automationMiddleware = {
      onAfterResponse: (message, data, resp) => {
        if (message === 'take:screenshot' && resp) {
          const existingScreenshot = _.findIndex(screenshots, { path: resp.path })

          if (existingScreenshot !== -1) {
            // NOTE: saving screenshots to the same path will overwrite the previous one
            // so we shouldn't report more screenshots than exist on disk.
            // this happens when cy.screenshot is used in a retried test
            screenshots.splice(existingScreenshot, 1, this.screenshotMetadata(data, resp))
          } else {
            screenshots.push(this.screenshotMetadata(data, resp))
          }
        }

        return resp
      },
    }

    const warnings = {}

    browserOpts.projectRoot = projectRoot

    browserOpts.onWarning = (err) => {
      const { message } = err

      // if this warning has already been
      // seen for this browser launch then
      // suppress it
      if (warnings[message]) {
        return
      }

      warnings[message] = err

      return project.onWarning
    }

    return openProject.launch(browser, spec, browserOpts)
  },

  listenForProjectEnd (project, exit) {
    return new Promise((resolve) => {
      if (exit === false) {
        resolve = () => {
          console.log('not exiting due to options.exit being false')
        }
      }

      const onEarlyExit = function (err) {
        console.log('')
        errors.log(err)

        // probably should say we ended
        // early too: (Ended Early: true)
        // in the stats
        const obj = {
          error: errors.stripAnsi(err.message),
          stats: {
            failures: 1,
            tests: 0,
            passes: 0,
            pending: 0,
            suites: 0,
            skipped: 0,
            wallClockDuration: 0,
            wallClockStartedAt: new Date().toJSON(),
            wallClockEndedAt: new Date().toJSON(),
          },
        }

        return resolve(obj)
      }

      const onEnd = (obj) => {
        return resolve(obj)
      }

      // when our project fires its end event
      // resolve the promise
      project.once('end', onEnd)

      // if we already received a reason to exit early, go ahead and do it
      if (this.earlyExitErr) {
        return onEarlyExit(this.earlyExitErr)
      }

      // otherwise override exitEarly so we exit as soon as there is a reason
      this.exitEarly = (err) => {
        onEarlyExit(err)
      }
    })
  },

  waitForBrowserToConnect (options = {}) {
    const { project, socketId, timeout, onError } = options
    const browserTimeout = process.env.CYPRESS_INTERNAL_BROWSER_CONNECT_TIMEOUT || timeout || 60000
    let attempts = 0

    const wait = () => {
      debug('waiting for socket to connect and browser to launch...')

      return Promise.join(
        this.waitForSocketConnection(project, socketId)
        .tap(() => {
          debug('socket connected', { socketId })
        }),
        this.launchBrowser(options)
        .tap(() => {
          debug('browser launched')
        }),
      )
      .timeout(browserTimeout)
      .catch(Promise.TimeoutError, (err) => {
        attempts += 1

        console.log('')

        // always first close the open browsers
        // before retrying or dieing
        return openProject.closeBrowser()
        .then(() => {
          if (attempts === 1 || attempts === 2) {
            // try again up to 3 attempts
            const word = attempts === 1 ? 'Retrying...' : 'Retrying again...'

            errors.warning('TESTS_DID_NOT_START_RETRYING', word)

            return wait()
          }

          err = errors.get('TESTS_DID_NOT_START_FAILED')
          errors.log(err)

          onError(err)
        })
      })
    }

    return wait()
  },

  waitForSocketConnection (project, id) {
    debug('waiting for socket connection... %o', { id })

    return new Promise((resolve, reject) => {
      const fn = function (socketId) {
        debug('got socket connection %o', { id: socketId })

        if (socketId === id) {
          // remove the event listener if we've connected
          project.removeListener('socket:connected', fn)

          // resolve the promise
          return resolve()
        }
      }

      // when a socket connects verify this
      // is the one that matches our id!
      return project.on('socket:connected', fn)
    })
  },

  waitForTestsToFinishRunning (options = {}) {
    const { project, screenshots, startedVideoCapture, endVideoCapture, videoName, compressedVideoName, videoCompression, videoUploadOnPasses, exit, spec, estimated, quiet } = options

    // https://github.com/cypress-io/cypress/issues/2370
    // delay 1 second if we're recording a video to give
    // the browser padding to render the final frames
    // to avoid chopping off the end of the video
    const delay = this.getVideoRecordingDelay(startedVideoCapture)

    return this.listenForProjectEnd(project, exit)
    .delay(delay)
    .then(async (obj) => {
      _.defaults(obj, {
        error: null,
        hooks: null,
        tests: null,
        video: null,
        screenshots: null,
        reporterStats: null,
      })

      if (startedVideoCapture) {
        obj.video = videoName
      }

      if (screenshots) {
        obj.screenshots = screenshots
      }

      obj.spec = spec

      const finish = () => {
        return obj
      }

      if (!quiet) {
        this.displayResults(obj, estimated)
        if (screenshots && screenshots.length) {
          this.displayScreenshots(screenshots)
        }
      }

      const { tests, stats } = obj

      const attempts = _.flatMap(tests, (test) => test.attempts)

      const hasFailingTests = _.get(stats, 'failures') > 0

      // if we have a video recording
      if (startedVideoCapture && tests && tests.length) {
        // always set the video timestamp on tests
        Reporter.setVideoTimestamp(startedVideoCapture, attempts)
      }

      // we should upload the video if we upload on passes (by default)
      // or if we have any failures and have started the video
      const suv = Boolean(videoUploadOnPasses === true || (startedVideoCapture && hasFailingTests))

      obj.shouldUploadVideo = suv

      let videoCaptureFailed = false

      if (endVideoCapture) {
        await endVideoCapture()
        .tapCatch(() => videoCaptureFailed = true)
        .catch(warnVideoRecordingFailed)
      }

      // always close the browser now as opposed to letting
      // it exit naturally with the parent process due to
      // electron bug in windows
      debug('attempting to close the browser')
      await openProject.closeBrowser()

      if (endVideoCapture && !videoCaptureFailed) {
        const ffmpegChaptersConfig = videoCapture.generateFfmpegChaptersConfig(obj.tests)

        await this.postProcessRecording(
          videoName,
          compressedVideoName,
          videoCompression,
          suv,
          quiet,
          ffmpegChaptersConfig,
        )
        .catch(warnVideoRecordingFailed)
      }

      return finish()
    })
  },

  screenshotMetadata (data, resp) {
    return {
      screenshotId: random.id(),
      name: data.name || null,
      testId: data.testId,
      testAttemptIndex: data.testAttemptIndex,
      takenAt: resp.takenAt,
      path: resp.path,
      height: resp.dimensions.height,
      width: resp.dimensions.width,
    }
  },

  runSpecs (options = {}) {
    _.defaults(options, {
      // only non-Electron browsers run headed by default
      headed: options.browser.name !== 'electron',
    })

    const { config, browser, sys, headed, outputPath, specs, specPattern, beforeSpecRun, afterSpecRun, runUrl, parallel, group, tag } = options

    const isHeadless = !headed

    browser.isHeadless = isHeadless
    browser.isHeaded = !isHeadless

    const results = {
      startedTestsAt: null,
      endedTestsAt: null,
      totalDuration: null,
      totalSuites: null,
      totalTests: null,
      totalFailed: null,
      totalPassed: null,
      totalPending: null,
      totalSkipped: null,
      runs: null,
      browserPath: browser.path,
      browserName: browser.name,
      browserVersion: browser.version,
      osName: sys.osName,
      osVersion: sys.osVersion,
      cypressVersion: pkg.version,
      runUrl,
      config,
    }

    if (!options.quiet) {
      displayRunStarting({
        config,
        specs,
        group,
        tag,
        runUrl,
        browser,
        parallel,
        specPattern,
      })
    }

    const runEachSpec = (spec, index, length, estimated) => {
      if (!options.quiet) {
        displaySpecHeader(spec.name, index + 1, length, estimated)
      }

      return this.runSpec(spec, options, estimated)
      .get('results')
      .tap((results) => {
        return debug('spec results %o', results)
      })
    }

    return iterateThroughSpecs({
      specs,
      config,
      parallel,
      runEachSpec,
      afterSpecRun,
      beforeSpecRun,
    })
    .then((runs = []) => {
      results.status = 'finished'
      results.startedTestsAt = getRun(_.first(runs), 'stats.wallClockStartedAt')
      results.endedTestsAt = getRun(_.last(runs), 'stats.wallClockEndedAt')
      results.totalDuration = sumByProp(runs, 'stats.wallClockDuration')
      results.totalSuites = sumByProp(runs, 'stats.suites')
      results.totalTests = sumByProp(runs, 'stats.tests')
      results.totalPassed = sumByProp(runs, 'stats.passes')
      results.totalPending = sumByProp(runs, 'stats.pending')
      results.totalFailed = sumByProp(runs, 'stats.failures')
      results.totalSkipped = sumByProp(runs, 'stats.skipped')
      results.runs = runs

      debug('final results of all runs: %o', results)

      const { each, remapKeys, remove, renameKey, setValue } = objUtils

      // Remap module API result json to remove private props and rename props to make more user-friendly
      const moduleAPIResults = remapKeys(results, {
        runs: each((run) => ({
          tests: each((test) => ({
            attempts: each((attempt, i) => ({
              timings: remove,
              failedFromHookId: remove,
              wallClockDuration: renameKey('duration'),
              wallClockStartedAt: renameKey('startedAt'),
              wallClockEndedAt: renameKey('endedAt'),
              screenshots: setValue(
                _(run.screenshots)
                .filter({ testId: test.testId, testAttemptIndex: i })
                .map((screenshot) => _.omit(screenshot,
                  ['screenshotId', 'testId', 'testAttemptIndex']))
                .value(),
              ),
            })),
            testId: remove,
          })),
          hooks: each({
            hookId: remove,
          }),
          stats: {
            wallClockDuration: renameKey('duration'),
            wallClockStartedAt: renameKey('startedAt'),
            wallClockEndedAt: renameKey('endedAt'),
          },
          screenshots: remove,
        })),
      })

      return writeOutput(outputPath, moduleAPIResults).return(results)
    })
  },

  runSpec (spec = {}, options = {}, estimated) {
    const { project, browser, onError } = options

    const { isHeadless } = browser

    debug('about to run spec %o', {
      spec,
      isHeadless,
      browser,
    })

    if (browser.family !== 'chromium' && !options.config.chromeWebSecurity) {
      console.log()
      errors.warning('CHROME_WEB_SECURITY_NOT_SUPPORTED', browser.family)
    }

    const screenshots = []

    // we know we're done running headlessly
    // when the renderer has connected and
    // finishes running all of the tests.
    // we're using an event emitter interface
    // to gracefully handle this in promise land

    return this.maybeStartVideoRecording({
      spec,
      browser,
      video: options.video,
      videosFolder: options.videosFolder,
    })
    .then((videoRecordProps = {}) => {
      return Promise.props({
        results: this.waitForTestsToFinishRunning({
          spec,
          project,
          estimated,
          screenshots,
          videoName: videoRecordProps.videoName,
          compressedVideoName: videoRecordProps.compressedVideoName,
          endVideoCapture: videoRecordProps.endVideoCapture,
          startedVideoCapture: videoRecordProps.startedVideoCapture,
          exit: options.exit,
          videoCompression: options.videoCompression,
          videoUploadOnPasses: options.videoUploadOnPasses,
          quiet: options.quiet,
        }),

        connection: this.waitForBrowserToConnect({
          spec,
          project,
          browser,
          screenshots,
          onError,
          writeVideoFrame: videoRecordProps.writeVideoFrame,
          socketId: options.socketId,
          webSecurity: options.webSecurity,
          projectRoot: options.projectRoot,
        }),
      })
    })
  },

  findSpecs (config, specPattern) {
    return specsUtil
    .find(config, specPattern)
    .tap((specs = []) => {
      if (debug.enabled) {
        const names = _.map(specs, 'name')

        return debug(
          'found \'%d\' specs using spec pattern \'%s\': %o',
          names.length,
          specPattern,
          names,
        )
      }
    })
  },

  ready (options = {}) {
    debug('run mode ready with options %o', options)

    _.defaults(options, {
      isTextTerminal: true,
      browser: 'electron',
      quiet: false,
    })

    const socketId = random.id()

    const { projectRoot, record, key, ciBuildId, parallel, group, browser: browserName, tag } = options

    // this needs to be a closure over `this.exitEarly` and not a reference
    // because `this.exitEarly` gets overwritten in `this.listenForProjectEnd`
    const onError = options.onError = (err) => {
      this.exitEarly(err)
    }

    // alias and coerce to null
    let specPattern = options.spec || null

    // ensure the project exists
    // and open up the project
    return browserUtils.getAllBrowsersWith()
    .then((browsers) => {
      debug('found all system browsers %o', browsers)
      options.browsers = browsers

      return createAndOpenProject(socketId, options)
      .then(({ project, projectId, config }) => {
        debug('project created and opened with config %o', config)

        // if we have a project id and a key but record hasnt been given
        recordMode.warnIfProjectIdButNoRecordOption(projectId, options)
        recordMode.throwIfRecordParamsWithoutRecording(record, ciBuildId, parallel, group, tag)

        if (record) {
          recordMode.throwIfNoProjectId(projectId, settings.configFile(options))
          recordMode.throwIfIncorrectCiBuildIdUsage(ciBuildId, parallel, group)
          recordMode.throwIfIndeterminateCiBuildId(ciBuildId, parallel, group)
        }

        // user code might have modified list of allowed browsers
        // but be defensive about it
        const userBrowsers = _.get(config, 'resolved.browsers.value', browsers)

        // all these operations are independent and should be run in parallel to
        // speed the initial booting time
        return Promise.all([
          system.info(),
          browserUtils.ensureAndGetByNameOrPath(browserName, false, userBrowsers).tap(removeOldProfiles),
          this.findSpecs(config, specPattern),
          trashAssets(config),
        ])
        .spread((sys = {}, browser = {}, specs = []) => {
        // return only what is return to the specPattern
          if (specPattern) {
            specPattern = specsUtil.getPatternRelativeToProjectRoot(specPattern, projectRoot)
          }

          if (!specs.length) {
            errors.throw('NO_SPECS_FOUND', config.integrationFolder, specPattern)
          }

          if (browser.family === 'chromium') {
            chromePolicyCheck.run(onWarning)
          }

          const runAllSpecs = ({ beforeSpecRun, afterSpecRun, runUrl, parallel }) => {
            return this.runSpecs({
              beforeSpecRun,
              afterSpecRun,
              projectRoot,
              specPattern,
              socketId,
              parallel,
              onError,
              browser,
              project,
              runUrl,
              group,
              config,
              specs,
              sys,
              tag,
              videosFolder: config.videosFolder,
              video: config.video,
              videoCompression: config.videoCompression,
              videoUploadOnPasses: config.videoUploadOnPasses,
              exit: options.exit,
              headed: options.headed,
              quiet: options.quiet,
              outputPath: options.outputPath,
            })
            .tap((runSpecs) => {
              if (!options.quiet) {
                renderSummaryTable(runUrl)(runSpecs)
              }
            })
          }

          if (record) {
            const { projectName } = config

            return recordMode.createRunAndRecordSpecs({
              key,
              sys,
              specs,
              group,
              tag,
              browser,
              parallel,
              ciBuildId,
              projectId,
              projectRoot,
              projectName,
              specPattern,
              runAllSpecs,
            })
          }

          // not recording, can't be parallel
          return runAllSpecs({
            parallel: false,
          })
        })
      })
    })
  },

  run (options) {
    return electronApp
    .waitForReady()
    .then(() => {
      return this.ready(options)
    })
  },
}
