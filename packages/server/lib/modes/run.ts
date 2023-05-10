/* eslint-disable no-console, @cypress/dev/arrow-body-multiline-braces */
import _ from 'lodash'
import pkg from '@packages/root'
import path from 'path'
import chalk from 'chalk'
import Debug from 'debug'
import Bluebird from 'bluebird'
import assert from 'assert'

import recordMode from './record'
import * as errors from '../errors'
import Reporter from '../reporter'
import browserUtils from '../browsers'
import { openProject } from '../open_project'
import * as videoCapture from '../video_capture'
import { fs } from '../util/fs'
import runEvents from '../plugins/run_events'
import env from '../util/env'
import trash from '../util/trash'
import random from '../util/random'
import system from '../util/system'
import chromePolicyCheck from '../util/chrome_policy_check'
import * as objUtils from '../util/obj_utils'
import type { SpecWithRelativeRoot, SpecFile, TestingType, OpenProjectLaunchOpts, FoundBrowser, BrowserVideoController, VideoRecording, ProcessOptions } from '@packages/types'
import type { Cfg } from '../project-base'
import type { Browser } from '../browsers/types'
import * as printResults from '../util/print-run'
import { telemetry } from '@packages/telemetry'

type SetScreenshotMetadata = (data: TakeScreenshotProps) => void
type ScreenshotMetadata = ReturnType<typeof screenshotMetadata>
type TakeScreenshotProps = any
type RunEachSpec = any
type BeforeSpecRun = any
type AfterSpecRun = any
type Project = NonNullable<ReturnType<typeof openProject['getProject']>>

let exitEarly = (err) => {
  debug('set early exit error: %s', err.stack)

  earlyExitErr = err
}
let earlyExitErr: Error
let currentSetScreenshotMetadata: SetScreenshotMetadata

const debug = Debug('cypress:server:run')

const DELAY_TO_LET_VIDEO_FINISH_MS = 1000

const relativeSpecPattern = (projectRoot, pattern) => {
  if (typeof pattern === 'string') {
    return pattern.replace(`${projectRoot}/`, '')
  }

  return pattern.map((x) => x.replace(`${projectRoot}/`, ''))
}

const iterateThroughSpecs = function (options: { specs: SpecFile[], runEachSpec: RunEachSpec, beforeSpecRun?: BeforeSpecRun, afterSpecRun?: AfterSpecRun, config: Cfg }) {
  const { specs, runEachSpec, beforeSpecRun, afterSpecRun, config } = options

  const serial = () => {
    return Bluebird.mapSeries(specs, runEachSpec)
  }

  const ranSpecs: SpecFile[] = []

  async function parallelAndSerialWithRecord (runs) {
    const { spec, claimedInstances, totalInstances, estimated } = await beforeSpecRun()

    // no more specs to run? then we're done!
    if (!spec) return runs

    // find the actual spec object amongst
    // our specs array since the API sends us
    // the relative name
    const specObject = _.find(specs, { relative: spec })

    if (!specObject) throw new Error(`Unable to find specObject for spec '${spec}'`)

    ranSpecs.push(specObject)

    const results = await runEachSpec(
      specObject,
      claimedInstances - 1,
      totalInstances,
      estimated,
    )

    runs.push(results)

    await afterSpecRun(specObject, results, config)

    // recurse
    return parallelAndSerialWithRecord(runs)
  }

  if (beforeSpecRun) {
    // if we are running in parallel
    // then ask the server for the next spec
    return parallelAndSerialWithRecord([])
  }

  // else iterate in serial
  return serial()
}

async function getProjectId (project, id) {
  if (id == null) {
    id = env.get('CYPRESS_PROJECT_ID')
  }

  // if we have an ID just use it
  if (id) return id

  try {
    return project.getProjectId()
  } catch (err) {
    // no id no problem
    return null
  }
}

const sumByProp = (runs, prop) => {
  return _.sumBy(runs, prop) || 0
}

const getRun = (run, prop) => {
  return _.get(run, prop)
}

async function writeOutput (outputPath, results) {
  if (!outputPath) {
    return
  }

  debug('saving output results %o', { outputPath })

  return fs.outputJson(outputPath, results)
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
    spec: args.spec,
    onError: args.onError,
  }

  return openProject.create(projectRoot, args, options)
}

async function checkAccess (folderPath) {
  return fs.access(folderPath, fs.constants.W_OK).catch((err) => {
    if (['EACCES', 'EPERM', 'EROFS'].includes(err.code)) {
      // we cannot write due to folder permissions, or read-only filesystem
      return errors.warning('FOLDER_NOT_WRITABLE', folderPath)
    }

    throw err
  })
}

const createAndOpenProject = async (options) => {
  const { projectRoot, projectId, socketId } = options

  await checkAccess(projectRoot)

  const open_project = await openProjectCreate(projectRoot, socketId, options)
  const project = open_project.getProject()

  if (!project) throw new Error('Missing project after openProjectCreate!')

  const [config, _projectId] = await Promise.all([
    project.getConfig(),
    getProjectId(project, projectId),
  ])

  return {
    project,
    config,
    projectId: _projectId,
    // Lazy require'd here, so as to not execute until we're in the electron process
    configFile: require('@packages/data-context').getCtx().lifecycleManager.configFile,
  }
}

const removeOldProfiles = (browser) => {
  return browserUtils.removeOldProfiles(browser)
  .catch((err) => {
    // dont make removing old browsers profiles break the build
    return errors.warning('CANNOT_REMOVE_OLD_BROWSER_PROFILES', err)
  })
}

async function trashAssets (config: Cfg) {
  if (config.trashAssetsBeforeRuns !== true) {
    return
  }

  try {
    await Promise.all([
      trash.folder(config.videosFolder),
      trash.folder(config.screenshotsFolder),
      trash.folder(config.downloadsFolder),
    ])
  } catch (err) {
    // dont make trashing assets fail the build
    errors.warning('CANNOT_TRASH_ASSETS', err)
  }
}

async function startVideoRecording (options: { previous?: VideoRecording, project: Project, spec: SpecWithRelativeRoot, videosFolder: string }): Promise<VideoRecording> {
  if (!options.videosFolder) throw new Error('Missing videoFolder for recording')

  function videoPath (suffix: string) {
    return path.join(options.videosFolder, options.spec.relativeToCommonRoot + suffix)
  }

  const videoName = videoPath('.mp4')
  const compressedVideoName = videoPath('-compressed.mp4')

  const outputDir = path.dirname(videoName)

  const onError = _.once((err) => {
    // catch video recording failures and log them out
    // but don't let this affect the run at all
    errors.warning('VIDEO_RECORDING_FAILED', err)

    return undefined
  })

  try {
    await fs.ensureDir(outputDir)
  } catch (err) {
    onError(err)
  }

  if (options.previous) {
    debug('in single-tab mode, re-using previous videoController')

    Object.assign(options.previous.api, {
      videoName,
      compressedVideoName,
      onError,
    })

    await options.previous.controller?.restart().catch(onError)

    return options.previous
  }

  let ffmpegController: BrowserVideoController
  let _ffmpegOpts: Pick<videoCapture.StartOptions, 'webmInput'>

  const videoRecording: VideoRecording = {
    api: {
      onError,
      videoName,
      compressedVideoName,
      async useFfmpegVideoController (ffmpegOpts) {
        _ffmpegOpts = ffmpegOpts || _ffmpegOpts
        ffmpegController = await videoCapture.start({ ...videoRecording.api, ..._ffmpegOpts })

        // This wrapper enables re-binding writeVideoFrame to a new video stream when running in single-tab mode.
        const controllerWrap: BrowserVideoController = {
          ...ffmpegController,
          writeVideoFrame: function writeVideoFrameWrap (data) {
            if (!ffmpegController) throw new Error('missing ffmpegController in writeVideoFrameWrap')

            ffmpegController.writeVideoFrame(data)
          },
          async restart () {
            await videoRecording.api.useFfmpegVideoController(_ffmpegOpts)
          },
        }

        videoRecording.api.useVideoController(controllerWrap)

        return controllerWrap
      },
      useVideoController (videoController) {
        debug('setting videoController for videoRecording %o', videoRecording)
        videoRecording.controller = videoController
      },
      onProjectCaptureVideoFrames (fn) {
        options.project.on('capture:video:frames', fn)
      },
    },
    controller: undefined,
  }

  options.project.videoRecording = videoRecording

  debug('created videoRecording %o', { videoRecording })

  return videoRecording
}

const warnVideoRecordingFailed = (err) => {
  // log that post processing was attempted
  // but failed and don't let this change the run exit code
  errors.warning('VIDEO_POST_PROCESSING_FAILED', err)
}

async function postProcessRecording (options: { quiet: boolean, videoCompression: number | boolean, shouldUploadVideo: boolean, processOptions: Omit<ProcessOptions, 'videoCompression'> }) {
  debug('ending the video recording %o', options)

  // once this ended promises resolves
  // then begin processing the file
  // don't process anything if videoCompress is off
  // or we've been told not to upload the video
  if (options.videoCompression === false || options.videoCompression === 0 || options.shouldUploadVideo === false) {
    return
  }

  const processOptions: ProcessOptions = {
    ...options.processOptions,
    videoCompression: Number(options.videoCompression),
  }

  function continueProcessing (onProgress?: (progress: number) => void) {
    return videoCapture.process({ ...processOptions, onProgress })
  }

  if (options.quiet) {
    return continueProcessing()
  }

  const { onProgress } = printResults.displayVideoProcessingProgress(processOptions)

  return continueProcessing(onProgress)
}

function launchBrowser (options: { browser: Browser, spec: SpecWithRelativeRoot, setScreenshotMetadata: SetScreenshotMetadata, screenshots: ScreenshotMetadata[], projectRoot: string, shouldLaunchNewTab: boolean, onError: (err: Error) => void, videoRecording?: VideoRecording }) {
  const { browser, spec, setScreenshotMetadata, screenshots, projectRoot, shouldLaunchNewTab, onError } = options

  const warnings = {}

  const browserOpts: OpenProjectLaunchOpts = {
    projectRoot,
    shouldLaunchNewTab,
    onError,
    videoApi: options.videoRecording?.api,
    automationMiddleware: {
      onBeforeRequest (message, data) {
        if (message === 'take:screenshot') {
          return setScreenshotMetadata(data)
        }
      },
      onAfterResponse: (message, data, resp) => {
        if (message === 'take:screenshot' && resp) {
          const existingScreenshot = _.findIndex(screenshots, { path: resp.path })

          if (existingScreenshot !== -1) {
            // NOTE: saving screenshots to the same path will overwrite the previous one
            // so we shouldn't report more screenshots than exist on disk.
            // this happens when cy.screenshot is used in a retried test
            screenshots.splice(existingScreenshot, 1, screenshotMetadata(data, resp))
          } else {
            screenshots.push(screenshotMetadata(data, resp))
          }
        }

        return resp
      },
    },
    onWarning: (err) => {
      const { message } = err

      // if this warning has already been
      // seen for this browser launch then
      // suppress it
      if (warnings[message]) return

      warnings[message] = err
    },
  }

  return openProject.launch(browser, spec, browserOpts)
}

function listenForProjectEnd (project, exit): Bluebird<any> {
  if (globalThis.CY_TEST_MOCK?.listenForProjectEnd) return Bluebird.resolve(globalThis.CY_TEST_MOCK.listenForProjectEnd)

  return new Bluebird((resolve, reject) => {
    if (exit === false) {
      resolve = () => {
        console.log('not exiting due to options.exit being false')
      }
    }

    const onEarlyExit = function (err) {
      if (err.isFatalApiErr) {
        return reject(err)
      }

      console.log('')
      errors.log(err)

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

    project.once('end', (results) => resolve(results))

    // if we already received a reason to exit early, go ahead and do it
    if (earlyExitErr) {
      return onEarlyExit(earlyExitErr)
    }

    // otherwise override exitEarly so we exit as soon as there is a reason
    exitEarly = (err) => {
      onEarlyExit(err)
    }
  })
}

async function waitForBrowserToConnect (options: { project: Project, socketId: string, onError: (err: Error) => void, spec: SpecWithRelativeRoot, isFirstSpec: boolean, testingType: string, experimentalSingleTabRunMode: boolean, browser: Browser, screenshots: ScreenshotMetadata[], projectRoot: string, shouldLaunchNewTab: boolean, webSecurity: boolean, videoRecording?: VideoRecording }) {
  if (globalThis.CY_TEST_MOCK?.waitForBrowserToConnect) return Promise.resolve()

  const { project, socketId, onError, spec } = options
  const browserTimeout = Number(process.env.CYPRESS_INTERNAL_BROWSER_CONNECT_TIMEOUT || 60000)
  let browserLaunchAttempt = 1

  // without this the run mode is only setting new spec
  // path for next spec in launch browser.
  // we need it to run on every spec even in single browser mode
  currentSetScreenshotMetadata = (data) => {
    data.specName = spec.relativeToCommonRoot

    return data
  }

  // TODO: remove the need to extend options and avoid the type error
  // @ts-expect-error
  options.setScreenshotMetadata = (data) => {
    return currentSetScreenshotMetadata(data)
  }

  if (options.experimentalSingleTabRunMode && options.testingType === 'component' && !options.isFirstSpec) {
    // reset browser state to match default behavior when opening/closing a new tab
    await openProject.resetBrowserState()

    // Send the new telemetry context to the browser to set the parent/child relationship appropriately for tests
    if (telemetry.isEnabled()) {
      openProject.updateTelemetryContext(JSON.stringify(telemetry.getActiveContextObject()))
    }

    // since we aren't re-launching the browser, we have to navigate to the next spec instead
    debug('navigating to next spec %s', spec)

    return openProject.changeUrlToSpec(spec)
  }

  const wait = async () => {
    telemetry.startSpan({ name: `waitForBrowserToConnect:attempt:${browserLaunchAttempt}` })

    debug('waiting for socket to connect and browser to launch...')

    return Bluebird.all([
      waitForSocketConnection(project, socketId),
      // TODO: remove the need to extend options and coerce this type
      launchBrowser(options as typeof options & { setScreenshotMetadata: SetScreenshotMetadata }),
    ])
    .timeout(browserTimeout)
    .then(() => {
      telemetry.getSpan(`waitForBrowserToConnect:attempt:${browserLaunchAttempt}`)?.end()
    })
    .catch(Bluebird.TimeoutError, async (err) => {
      telemetry.getSpan(`waitForBrowserToConnect:attempt:${browserLaunchAttempt}`)?.end()
      console.log('')

      // always first close the open browsers
      // before retrying or dieing
      await openProject.closeBrowser()

      if (browserLaunchAttempt === 1 || browserLaunchAttempt === 2) {
        // try again up to 3 attempts
        const word = browserLaunchAttempt === 1 ? 'Retrying...' : 'Retrying again...'

        errors.warning('TESTS_DID_NOT_START_RETRYING', word)
        browserLaunchAttempt += 1

        return await wait()
      }

      err = errors.get('TESTS_DID_NOT_START_FAILED')
      errors.log(err)

      onError(err)
    })
  }

  return wait()
}

function waitForSocketConnection (project: Project, id: string) {
  if (globalThis.CY_TEST_MOCK?.waitForSocketConnection) return

  debug('waiting for socket connection... %o', { id })

  return new Promise<void>((resolve, reject) => {
    const fn = function (socketId) {
      debug('got socket connection %o', { id: socketId })

      if (socketId === id) {
        // remove the event listener if we've connected
        project.removeListener('socket:connected', fn)

        debug('socket connected', { socketId })

        // resolve the promise
        return resolve()
      }
    }

    // when a socket connects verify this
    // is the one that matches our id!
    return project.on('socket:connected', fn)
  })
}

async function waitForTestsToFinishRunning (options: { project: Project, screenshots: ScreenshotMetadata[], videoCompression: number | false, videoUploadOnPasses: boolean, exit: boolean, spec: SpecWithRelativeRoot, estimated: number, quiet: boolean, config: Cfg, shouldKeepTabOpen: boolean, testingType: TestingType, videoRecording?: VideoRecording }) {
  if (globalThis.CY_TEST_MOCK?.waitForTestsToFinishRunning) return Promise.resolve(globalThis.CY_TEST_MOCK.waitForTestsToFinishRunning)

  const { project, screenshots, videoRecording, videoCompression, videoUploadOnPasses, exit, spec, estimated, quiet, config, shouldKeepTabOpen, testingType } = options

  const results = await listenForProjectEnd(project, exit)

  debug('received project end %o', results)

  // https://github.com/cypress-io/cypress/issues/2370
  // delay 1 second if we're recording a video to give
  // the browser padding to render the final frames
  // to avoid chopping off the end of the video
  const videoController = videoRecording?.controller

  debug('received videoController %o', { videoController })

  if (videoController) {
    const span = telemetry.startSpan({ name: 'video:capture:delayToLetFinish' })

    debug('delaying to extend video %o', { DELAY_TO_LET_VIDEO_FINISH_MS })
    await Bluebird.delay(DELAY_TO_LET_VIDEO_FINISH_MS)
    span?.end()
  }

  _.defaults(results, {
    error: null,
    hooks: null,
    tests: null,
    video: null,
    screenshots: null,
    reporterStats: null,
  })

  // Cypress Cloud told us to skip this spec
  const skippedSpec = results.skippedSpec

  if (screenshots) {
    results.screenshots = screenshots
  }

  results.spec = spec

  const { tests, stats } = results
  const attempts = _.flatMap(tests, (test) => test.attempts)

  let videoCaptureFailed = false

  // if we have a video recording
  if (videoController) {
    results.video = videoRecording!.api.videoName

    if (tests && tests.length) {
      // always set the video timestamp on tests
      Reporter.setVideoTimestamp(videoController.startedVideoCapture, attempts)
    }

    try {
      await videoController.endVideoCapture()
      debug('ended video capture')
    } catch (err) {
      videoCaptureFailed = true
      warnVideoRecordingFailed(err)
    }

    telemetry.getSpan('video:capture')?.setAttributes({ videoCaptureFailed })?.end()
  }

  const afterSpecSpan = telemetry.startSpan({ name: 'lifecycle:after:spec' })

  debug('execute after:spec')
  await runEvents.execute('after:spec', spec, results)
  afterSpecSpan?.end()

  const videoName = videoRecording?.api.videoName
  const videoExists = videoName && await fs.pathExists(videoName)

  if (!videoExists) {
    // the video file no longer exists at the path where we expect it,
    // possibly because the user deleted it in the after:spec event
    debug(`No video found after spec ran - skipping processing. Video path: ${videoName}`)

    results.video = null
  }

  const hasFailingTests = _.get(stats, 'failures') > 0
  // we should upload the video if we upload on passes (by default)
  // or if we have any failures and have started the video
  const shouldUploadVideo = !skippedSpec && videoUploadOnPasses === true || Boolean((/* startedVideoCapture */ videoExists && hasFailingTests))

  results.shouldUploadVideo = shouldUploadVideo

  if (!shouldUploadVideo) {
    debug(`Spec run had no failures and config.videoUploadOnPasses=false. Skip processing video. Video path: ${videoName}`)
    results.video = null
  }

  if (!quiet && !skippedSpec) {
    printResults.displayResults(results, estimated)
  }

  // @ts-expect-error experimentalSingleTabRunMode only exists on the CT-specific config type
  const usingExperimentalSingleTabMode = testingType === 'component' && config.experimentalSingleTabRunMode

  if (usingExperimentalSingleTabMode) {
    await project.server.destroyAut()
  }

  // we do not support experimentalSingleTabRunMode for e2e
  if (!usingExperimentalSingleTabMode) {
    debug('attempting to close the browser tab')

    await openProject.resetBrowserTabsForNextTest(shouldKeepTabOpen)

    debug('resetting server state')

    project.server.reset()
  }

  if (videoExists && !skippedSpec && !videoCaptureFailed) {
    const span = telemetry.startSpan({ name: 'video:post:processing' })
    const chaptersConfig = videoCapture.generateFfmpegChaptersConfig(results.tests)

    try {
      debug('post processing recording')

      span?.setAttributes({
        videoName,
        videoCompressionString: videoCompression.toString(),
        compressedVideoName: videoRecording.api.compressedVideoName,
      })

      await postProcessRecording({
        shouldUploadVideo,
        quiet,
        videoCompression,
        processOptions: {
          compressedVideoName: videoRecording.api.compressedVideoName,
          videoName,
          chaptersConfig,
          ...(videoRecording.controller!.postProcessFfmpegOptions || {}),
        },
      })
    } catch (err) {
      videoCaptureFailed = true
      warnVideoRecordingFailed(err)
    }
    span?.end()
  }

  if (videoCaptureFailed) {
    results.video = null
  }

  return results
}

function screenshotMetadata (data, resp) {
  return {
    screenshotId: random.id(),
    name: data.name || null,
    testId: data.testId,
    testAttemptIndex: data.testAttemptIndex,
    takenAt: resp.takenAt,
    path: resp.path,
    height: resp.dimensions.height,
    width: resp.dimensions.width,
    pathname: undefined as string | undefined,
  }
}

async function runSpecs (options: { config: Cfg, browser: Browser, sys: any, headed: boolean, outputPath: string, specs: SpecWithRelativeRoot[], specPattern: string | RegExp | string[], beforeSpecRun?: BeforeSpecRun, afterSpecRun?: AfterSpecRun, runUrl?: string, parallel?: boolean, group?: string, tag?: string, autoCancelAfterFailures?: number | false, testingType: TestingType, quiet: boolean, project: Project, onError: (err: Error) => void, exit: boolean, socketId: string, webSecurity: boolean, projectRoot: string } & Pick<Cfg, 'video' | 'videoCompression' | 'videosFolder' | 'videoUploadOnPasses'>) {
  if (globalThis.CY_TEST_MOCK?.runSpecs) return globalThis.CY_TEST_MOCK.runSpecs

  const { config, browser, sys, headed, outputPath, specs, specPattern, beforeSpecRun, afterSpecRun, runUrl, parallel, group, tag, autoCancelAfterFailures } = options

  const isHeadless = !headed

  browser.isHeadless = isHeadless
  browser.isHeaded = !isHeadless

  if (!options.quiet) {
    printResults.displayRunStarting({
      config,
      specs,
      group,
      tag,
      runUrl,
      browser,
      parallel,
      specPattern,
      autoCancelAfterFailures,
    })
  }

  let isFirstSpec = true

  async function runEachSpec (spec: SpecWithRelativeRoot, index: number, length: number, estimated: number) {
    const span = telemetry.startSpan({
      name: 'run:spec',
      active: true,
    })

    span?.setAttributes({
      specName: spec.name,
      type: spec.specType,
      firstSpec: isFirstSpec,
    })

    if (!options.quiet) {
      printResults.displaySpecHeader(spec.relativeToCommonRoot, index + 1, length, estimated)
    }

    const { results } = await runSpec(config, spec, options, estimated, isFirstSpec, index === length - 1)

    isFirstSpec = false

    debug('spec results %o', results)

    span?.end()

    return results
  }

  const beforeRunDetails = {
    browser,
    config,
    cypressVersion: pkg.version,
    group,
    parallel,
    runUrl,
    specs,
    specPattern,
    system: _.pick(sys, 'osName', 'osVersion'),
    tag,
    autoCancelAfterFailures,
  }

  const runSpan = telemetry.startSpan({ name: 'run' })

  runSpan?.setAttributes({
    recordEnabled: !!runUrl,
    ...(runUrl && {
      recordOpts: JSON.stringify({
        runUrl,
        parallel,
        group,
        tag,
        autoCancelAfterFailures,
      }),
    }),
  })

  const beforeRunSpan = telemetry.startSpan({ name: 'lifecycle:before:run' })

  await runEvents.execute('before:run', beforeRunDetails)
  beforeRunSpan?.end()

  const runs = await iterateThroughSpecs({
    specs,
    config,
    runEachSpec,
    afterSpecRun,
    beforeSpecRun,
  })

  const results: CypressCommandLine.CypressRunResult = {
    status: 'finished',
    startedTestsAt: getRun(_.first(runs), 'stats.wallClockStartedAt'),
    endedTestsAt: getRun(_.last(runs), 'stats.wallClockEndedAt'),
    totalDuration: sumByProp(runs, 'stats.wallClockDuration'),
    totalSuites: sumByProp(runs, 'stats.suites'),
    totalTests: sumByProp(runs, 'stats.tests'),
    totalPassed: sumByProp(runs, 'stats.passes'),
    totalPending: sumByProp(runs, 'stats.pending'),
    totalFailed: sumByProp(runs, 'stats.failures'),
    totalSkipped: sumByProp(runs, 'stats.skipped'),
    runs,
    browserPath: browser.path,
    browserName: browser.name,
    browserVersion: browser.version,
    osName: sys.osName,
    osVersion: sys.osVersion,
    cypressVersion: pkg.version,
    runUrl,
    // @ts-expect-error slight type mismatch in public types vs internal types
    config,
  }

  debug('final results of all runs: %o', results)

  const { each, remapKeys, remove, renameKey, setValue } = objUtils

  // Remap results for module API/after:run to remove private props and
  // rename props to make more user-friendly
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

  const afterRunSpan = telemetry.startSpan({ name: 'lifecycle:after:run' })

  await runEvents.execute('after:run', moduleAPIResults)
  afterRunSpan?.end()

  await writeOutput(outputPath, moduleAPIResults)
  runSpan?.end()

  return results
}

async function runSpec (config, spec: SpecWithRelativeRoot, options: { project: Project, browser: Browser, onError: (err: Error) => void, config: Cfg, quiet: boolean, exit: boolean, testingType: TestingType, socketId: string, webSecurity: boolean, projectRoot: string } & Pick<Cfg, 'video' | 'videosFolder' | 'videoCompression' | 'videoUploadOnPasses'>, estimated, isFirstSpec, isLastSpec) {
  const { project, browser, onError } = options

  const { isHeadless } = browser

  debug('about to run spec %o', {
    spec,
    isHeadless,
    browser,
  })

  if (browser.family !== 'chromium' && !options.config.chromeWebSecurity) {
    console.log('')
    errors.warning('CHROME_WEB_SECURITY_NOT_SUPPORTED', browser.family)
  }

  const screenshots = []

  async function getVideoRecording () {
    if (!options.video) return undefined

    const opts = { project, spec, videosFolder: options.videosFolder }

    telemetry.startSpan({ name: 'video:capture' })

    if (config.experimentalSingleTabRunMode && !isFirstSpec && project.videoRecording) {
      // in single-tab mode, only the first spec needs to create a videoRecording object
      // which is then re-used between specs
      return await startVideoRecording({ ...opts, previous: project.videoRecording })
    }

    return await startVideoRecording(opts)
  }

  const videoRecording = await getVideoRecording()

  // we know we're done running headlessly
  // when the renderer has connected and
  // finishes running all of the tests.

  const [results] = await Promise.all([
    waitForTestsToFinishRunning({
      spec,
      config,
      project,
      estimated,
      screenshots,
      videoRecording,
      exit: options.exit,
      testingType: options.testingType,
      videoCompression: options.videoCompression,
      videoUploadOnPasses: options.videoUploadOnPasses,
      quiet: options.quiet,
      shouldKeepTabOpen: !isLastSpec,
    }),
    waitForBrowserToConnect({
      spec,
      project,
      browser,
      screenshots,
      onError,
      videoRecording,
      socketId: options.socketId,
      webSecurity: options.webSecurity,
      projectRoot: options.projectRoot,
      testingType: options.testingType,
      isFirstSpec,
      experimentalSingleTabRunMode: config.experimentalSingleTabRunMode,
      shouldLaunchNewTab: !isFirstSpec,
    }),
  ])

  return { results }
}

async function ready (options: { projectRoot: string, record: boolean, key: string, ciBuildId: string, parallel: boolean, group: string, browser: string, tag: string, testingType: TestingType, autoCancelAfterFailures: number | false, socketId: string, spec: string | RegExp | string[], headed: boolean, outputPath: string, exit: boolean, quiet: boolean, onError?: (err: Error) => void, browsers?: FoundBrowser[], webSecurity: boolean }) {
  debug('run mode ready with options %o', options)

  if (process.env.ELECTRON_RUN_AS_NODE && !process.env.DISPLAY) {
    debug('running electron as a node process without xvfb')
  }

  _.defaults(options, {
    isTextTerminal: true,
    browser: 'electron',
    quiet: false,
  })

  const { projectRoot, record, key, ciBuildId, parallel, group, browser: browserName, tag, testingType, socketId, autoCancelAfterFailures } = options

  assert(socketId)

  // this needs to be a closure over `exitEarly` and not a reference
  // because `exitEarly` gets overwritten in `listenForProjectEnd`
  // TODO: refactor this so we don't need to extend options
  const onError = options.onError = (err) => exitEarly(err)

  // alias and coerce to null
  let specPatternFromCli = options.spec || null

  // ensure the project exists
  // and open up the project
  const browsers = await browserUtils.get()

  debug('found all system browsers %o', browsers)
  // TODO: refactor this so we don't need to extend options
  options.browsers = browsers

  const { project, projectId, config, configFile } = await createAndOpenProject(options)

  debug('project created and opened with config %o', config)

  // if we have a project id and a key but record hasnt been given
  recordMode.warnIfProjectIdButNoRecordOption(projectId, options)
  recordMode.throwIfRecordParamsWithoutRecording(record, ciBuildId, parallel, group, tag, autoCancelAfterFailures)

  if (record) {
    recordMode.throwIfNoProjectId(projectId, configFile)
    recordMode.throwIfIncorrectCiBuildIdUsage(ciBuildId, parallel, group)
    recordMode.throwIfIndeterminateCiBuildId(ciBuildId, parallel, group)
  }

  // user code might have modified list of allowed browsers
  // but be defensive about it
  const userBrowsers = _.get(config, 'resolved.browsers.value', browsers)

  let specPattern = specPatternFromCli || config.specPattern

  specPattern = relativeSpecPattern(projectRoot, specPattern)

  const [sys, browser] = await Promise.all([
    system.info(),
    (async () => {
      const browser = await browserUtils.ensureAndGetByNameOrPath(browserName, false, userBrowsers)

      await removeOldProfiles(browser)

      return browser
    })(),
    trashAssets(config),
  ])

  // @ts-expect-error ctx is protected
  const specs = project.ctx.project.specs

  if (!specs.length) {
    errors.throwErr('NO_SPECS_FOUND', projectRoot, String(specPattern))
  }

  if (browser.unsupportedVersion && browser.warning) {
    errors.throwErr('UNSUPPORTED_BROWSER_VERSION', browser.warning)
  }

  if (browser.family === 'chromium') {
    chromePolicyCheck.run(onWarning)
  }

  async function runAllSpecs ({ beforeSpecRun, afterSpecRun, runUrl, parallel }: { beforeSpecRun?: BeforeSpecRun, afterSpecRun?: AfterSpecRun, runUrl?: string, parallel?: boolean}) {
    const results = await runSpecs({
      autoCancelAfterFailures,
      beforeSpecRun,
      afterSpecRun,
      projectRoot,
      socketId,
      parallel,
      onError,
      // TODO: refactor this so that augmenting the browser object here is not needed and there is no type conflict
      // @ts-expect-error runSpecs augments browser with isHeadless and isHeaded, which is "missing" from the type here
      browser,
      project,
      runUrl,
      group,
      config,
      specs,
      sys,
      tag,
      specPattern,
      videosFolder: config.videosFolder,
      video: config.video,
      videoCompression: config.videoCompression,
      videoUploadOnPasses: config.videoUploadOnPasses,
      headed: options.headed,
      quiet: options.quiet,
      outputPath: options.outputPath,
      testingType: options.testingType,
      exit: options.exit,
      webSecurity: options.webSecurity,
    })

    if (!options.quiet) {
      printResults.renderSummaryTable(runUrl, results)
      printResults.maybeLogCloudRecommendationMessage(results.runs || [], record)
    }

    return results
  }

  if (record) {
    const { projectName } = config

    return recordMode.createRunAndRecordSpecs({
      autoCancelAfterFailures,
      tag,
      key,
      sys,
      specs,
      group,
      config,
      browser,
      parallel,
      ciBuildId,
      testingType,
      project,
      projectId,
      projectRoot,
      projectName,
      specPattern,
      runAllSpecs,
      onError,
      quiet: options.quiet,
    })
  }

  // not recording, can't be parallel
  return runAllSpecs({
    parallel: false,
  })
}

export async function run (options, loading: Promise<void>) {
  if (require('../util/electron-app').isRunningAsElectronProcess({ debug })) {
    const app = require('electron').app

    // electron >= 5.0.0 will exit the app if all browserwindows are closed,
    // this is obviously undesirable in run mode
    // https://github.com/cypress-io/cypress/pull/4720#issuecomment-514316695
    app.on('window-all-closed', () => {
      debug('all BrowserWindows closed, not exiting')
    })

    telemetry.getSpan('binary:startup')?.end()

    await app.whenReady()
  }

  await loading

  try {
    return ready(options)
  } catch (e) {
    return exitEarly(e)
  }
}
