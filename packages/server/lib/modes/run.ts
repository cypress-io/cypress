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
import type { SpecWithRelativeRoot, SpecFile, TestingType, OpenProjectLaunchOpts, FoundBrowser, BrowserVideoController, VideoRecording, ProcessOptions } from '@packages/types'
import type { Cfg, ProjectBase } from '../project-base'
import type { Browser } from '../browsers/types'
import * as printResults from '../util/print-run'
import type { ProtocolManager } from '../cloud/protocol'
import { telemetry } from '@packages/telemetry'
import { CypressRunResult, createPublicBrowser, createPublicConfig, createPublicRunResults, createPublicSpec, createPublicSpecResults } from './results'
import { EarlyExitTerminator } from '../util/graceful_crash_handling'

type SetScreenshotMetadata = (data: TakeScreenshotProps) => void
type ScreenshotMetadata = ReturnType<typeof screenshotMetadata>
type TakeScreenshotProps = any
type RunEachSpec = any
type BeforeSpecRun = any
type AfterSpecRun = any
type Project = NonNullable<ReturnType<typeof openProject['getProject']>>

let currentSetScreenshotMetadata: SetScreenshotMetadata
let isRunCancelled = false

const debug = Debug('cypress:server:run')
const DELAY_TO_LET_VIDEO_FINISH_MS = 1000

let earlyExitTerminator = new EarlyExitTerminator()

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
    const { spec, claimedInstances, totalInstances, estimated, instanceId } = await beforeSpecRun()

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
      instanceId,
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

const warnVideoCaptureFailed = (err) => {
  // log that capturing video was attempted
  // but failed and don't let this change the run exit code
  errors.warning('VIDEO_CAPTURE_FAILED', err)
}

const warnVideoCompressionFailed = (err) => {
  // log that compression was attempted
  // but failed and don't let this change the run exit code
  errors.warning('VIDEO_COMPRESSION_FAILED', err)
}

async function compressRecording (options: { quiet: boolean, videoCompression: number | boolean, processOptions: Omit<ProcessOptions, 'videoCompression'> }) {
  debug('ending the video recording %o', options)

  // once this ended promises resolves
  // then begin compressing the file
  // don't compress anything if videoCompress is off
  // or we've been told not to upload the video
  if (options.videoCompression === false || options.videoCompression === 0) {
    debug('skipping compression')

    return
  }

  // if a user passes in videoCompression='true' into their config, coerce the value
  // to the default CRF value which is 32
  if (options.videoCompression === true) {
    debug('coercing compression to 32 CRF')
    options.videoCompression = 32
  }

  const processOptions: ProcessOptions = {
    ...options.processOptions,
    videoCompression: Number(options.videoCompression),
  }

  function continueWithCompression (onProgress?: (progress: number) => void) {
    return videoCapture.compress({ ...processOptions, onProgress })
  }

  if (options.quiet) {
    return continueWithCompression()
  }

  const { onProgress } = printResults.displayVideoCompressionProgress(processOptions)

  return continueWithCompression(onProgress)
}

function launchBrowser (options: { browser: Browser, spec: SpecWithRelativeRoot, setScreenshotMetadata: SetScreenshotMetadata, screenshots: ScreenshotMetadata[], projectRoot: string, shouldLaunchNewTab: boolean, onError: (err: Error) => void, videoRecording?: VideoRecording, protocolManager?: ProtocolManager }) {
  const { browser, spec, setScreenshotMetadata, screenshots, projectRoot, shouldLaunchNewTab, onError, protocolManager } = options

  const warnings = {}

  const browserOpts: OpenProjectLaunchOpts = {
    protocolManager,
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

async function listenForProjectEnd (project: ProjectBase, exit: boolean): Promise<any> {
  if (globalThis.CY_TEST_MOCK?.listenForProjectEnd) return Bluebird.resolve(globalThis.CY_TEST_MOCK.listenForProjectEnd)

  // if exit is false, we need to intercept the resolution of tests - whether
  // an early exit with intermediate results, or a full run.
  return new Promise((resolve, reject) => {
    Promise.race([
      new Promise((res) => {
        project.once('end', (results) => {
          debug('project ended with results %O', results)
          // If the project ends and the spec is skipped, treat the run as cancelled
          // as we do not want to update the dev server unnecessarily for justInTimeCompile.
          if (results?.skippedSpec) {
            isRunCancelled = true
          }

          res(results)
        })
      }),
      earlyExitTerminator.waitForEarlyExit(project, exit),
    ]).then((results) => {
      if (exit === false) {
        // eslint-disable-next-line no-console
        console.log('not exiting due to options.exit being false')
      } else {
        resolve(results)
      }
    }).catch((err) => {
      reject(err)
    })
  })
}

async function waitForBrowserToConnect (options: { project: Project, socketId: string, onError: (err: Error) => void, spec: SpecWithRelativeRoot, isFirstSpecInBrowser: boolean, testingType: string, experimentalSingleTabRunMode: boolean, browser: Browser, screenshots: ScreenshotMetadata[], projectRoot: string, shouldLaunchNewTab: boolean, webSecurity: boolean, videoRecording?: VideoRecording, protocolManager?: ProtocolManager }) {
  if (globalThis.CY_TEST_MOCK?.waitForBrowserToConnect) return Promise.resolve()

  const { project, socketId, onError, spec, browser, protocolManager } = options
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

  if (options.experimentalSingleTabRunMode && options.testingType === 'component' && !options.isFirstSpecInBrowser) {
    // reset browser state to match default behavior when opening/closing a new tab
    await openProject.resetBrowserState()

    // Send the new telemetry context to the browser to set the parent/child relationship appropriately for tests
    if (telemetry.isEnabled()) {
      openProject.updateTelemetryContext(JSON.stringify(telemetry.getActiveContextObject()))
    }

    // since we aren't going to be opening a new tab,
    // we need to tell the protocol manager to reconnect to the existing browser
    if (protocolManager) {
      await openProject.connectProtocolToBrowser({ browser, foundBrowsers: project.options.browsers, protocolManager })
    }

    // since we aren't re-launching the browser, we have to navigate to the next spec instead
    debug('navigating to next spec %s', createPublicSpec(spec))

    return openProject.changeUrlToSpec(spec)
  }

  const wait = async () => {
    telemetry.startSpan({ name: `waitForBrowserToConnect:attempt:${browserLaunchAttempt}` })

    debug('waiting for socket to connect and browser to launch...')

    const coreData = require('@packages/data-context').getCtx().coreData

    if (coreData.didBrowserPreviouslyHaveUnexpectedExit) {
      debug(`browser previously exited. Setting shouldLaunchNewTab=false to recreate the correct browser automation clients.`)
      options.shouldLaunchNewTab = false
      coreData.didBrowserPreviouslyHaveUnexpectedExit = false
    }

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
      debug('Catch on waitForBrowserToConnect')
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

async function waitForTestsToFinishRunning (options: { project: Project, screenshots: ScreenshotMetadata[], videoCompression: number | boolean, exit: boolean, spec: SpecWithRelativeRoot, estimated: number, quiet: boolean, config: Cfg, shouldKeepTabOpen: boolean, isLastSpec: boolean, testingType: TestingType, videoRecording?: VideoRecording, protocolManager?: ProtocolManager }) {
  if (globalThis.CY_TEST_MOCK?.waitForTestsToFinishRunning) return Promise.resolve(globalThis.CY_TEST_MOCK.waitForTestsToFinishRunning)

  const { project, screenshots, videoRecording, videoCompression, exit, spec, estimated, quiet, config, shouldKeepTabOpen, isLastSpec, testingType, protocolManager } = options

  const results = await listenForProjectEnd(project, exit)

  debug('received project end')

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

  // https://github.com/cypress-io/cypress/issues/2370
  // delay 1 second if we're recording a video to give
  // the browser padding to render the final frames
  // to avoid chopping off the end of the video
  const videoController = videoRecording?.controller

  debug('received videoController %o', { videoController })

  if (videoController && !skippedSpec) {
    const span = telemetry.startSpan({ name: 'video:capture:delayToLetFinish' })

    debug('delaying to extend video %o', { DELAY_TO_LET_VIDEO_FINISH_MS })
    await Bluebird.delay(DELAY_TO_LET_VIDEO_FINISH_MS)
    span?.end()
  }

  if (screenshots) {
    results.screenshots = screenshots
  }

  results.spec = spec

  const { tests } = results
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
      await videoController.endVideoCapture(!skippedSpec)
      debug('ended video capture')
    } catch (err) {
      videoCaptureFailed = true
      warnVideoCaptureFailed(err)
    }

    telemetry.getSpan('video:capture')?.setAttributes({ videoCaptureFailed })?.end()
  }

  const afterSpecSpan = telemetry.startSpan({ name: 'lifecycle:after:spec' })

  const [publicSpec, publicResults] = createPublicSpecResults(spec, results)

  debug('spec results: %o', publicResults)

  debug('execute after:spec')

  await runEvents.execute('after:spec', publicSpec, publicResults)
  afterSpecSpan?.end()

  await protocolManager?.afterSpec()

  const videoName = videoRecording?.api.videoName
  const videoExists = videoName && await fs.pathExists(videoName)

  if (!videoExists) {
    // the video file no longer exists at the path where we expect it,
    // possibly because the user deleted it in the after:spec event
    debug(`No video found after spec ran - skipping compression. Video path: ${videoName}`)

    results.video = null
  }

  if (!quiet && !skippedSpec) {
    printResults.displayResults(results, estimated)
  }

  // @ts-expect-error experimentalSingleTabRunMode only exists on the CT-specific config type
  const usingExperimentalSingleTabMode = testingType === 'component' && config.experimentalSingleTabRunMode

  if (usingExperimentalSingleTabMode && !isLastSpec) {
    await project.server.destroyAut()
  }

  // we do not support experimentalSingleTabRunMode for e2e. We always want to close the tab on the last spec to ensure that things get cleaned up properly at the end of the run
  if (!usingExperimentalSingleTabMode || isLastSpec) {
    debug('attempting to close the browser tab')

    await openProject.resetBrowserTabsForNextSpec(shouldKeepTabOpen)

    debug('resetting server state')

    project.server.reset()
  }

  let videoCompressionFailed = false

  if (videoExists && !skippedSpec && !videoCaptureFailed) {
    const span = telemetry.startSpan({ name: 'video:compression' })
    const chaptersConfig = videoCapture.generateFfmpegChaptersConfig(results.tests)

    printResults.printVideoHeader()

    try {
      debug('compressing recording')

      span?.setAttributes({
        videoName,
        videoCompressionString: videoCompression.toString(),
        compressedVideoName: videoRecording.api.compressedVideoName,
      })

      await compressRecording({
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
      videoCompressionFailed = true
      warnVideoCompressionFailed(err)
    }
    span?.end()
  }

  // only fail to print the video if capturing the video fails.
  // otherwise, print the video path to the console if it exists regardless of whether compression fails or not
  if (!videoCaptureFailed && videoExists) {
    printResults.printVideoPath(videoName)
  }

  if (videoCaptureFailed || videoCompressionFailed) {
    results.video = null
  }

  // the early exit terminator persists between specs,
  // so if this spec crashed, the next one will report as
  // a crash too unless it is reset. Would like to not rely
  // on closure, but threading through fn props via options is also not
  // great.
  earlyExitTerminator = new EarlyExitTerminator()

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

async function runSpecs (options: { config: Cfg, browser: Browser, sys: any, headed: boolean, outputPath: string, specs: SpecWithRelativeRoot[], specPattern: string | RegExp | string[], beforeSpecRun?: BeforeSpecRun, afterSpecRun?: AfterSpecRun, runUrl?: string, parallel?: boolean, group?: string, tag?: string, autoCancelAfterFailures?: number | false, testingType: TestingType, quiet: boolean, project: Project, onError: (err: Error) => void, exit: boolean, socketId: string, webSecurity: boolean, projectRoot: string, protocolManager?: ProtocolManager } & Pick<Cfg, 'video' | 'videoCompression' | 'videosFolder'>) {
  if (globalThis.CY_TEST_MOCK?.runSpecs) return globalThis.CY_TEST_MOCK.runSpecs

  const { config, browser, sys, headed, outputPath, specs, specPattern, beforeSpecRun, afterSpecRun, runUrl, parallel, group, tag, autoCancelAfterFailures, protocolManager } = options

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

  let isFirstSpecInBrowser = true

  async function runEachSpec (spec: SpecWithRelativeRoot, index: number, length: number, estimated: number, instanceId: string) {
    const span = telemetry.startSpan({
      name: 'run:spec',
      active: true,
    })

    span?.setAttributes({
      specName: spec.name,
      type: spec.specType,
      firstSpec: isFirstSpecInBrowser,
    })

    await protocolManager?.beforeSpec({
      ...spec,
      instanceId,
    })

    if (!options.quiet) {
      printResults.displaySpecHeader(spec.relativeToCommonRoot, index + 1, length, estimated)
    }

    const isJustInTimeCompile = options.testingType === 'component' && config.justInTimeCompile

    // Only update the dev server if the run is not cancelled
    if (isJustInTimeCompile) {
      if (isRunCancelled) {
        // TODO: this logic to skip updating the dev-server on cancel needs a system-test before the feature goes generally available.
        debug(`isJustInTimeCompile=true and run is cancelled. Not updating dev server with spec ${spec.absolute}.`)
      } else {
        const ctx = require('@packages/data-context').getCtx()

        // If in run mode, we need to update the dev server with our spec.
        // in open mode, this happens in the browser through the web socket, but we do it here in run mode
        // to try and have it happen as early as possible to make the test run as fast as possible
        await ctx._apis.projectApi.getDevServer().updateSpecs([spec])
      }
    }

    const { results } = await runSpec(config, spec, options, estimated, isFirstSpecInBrowser, index === length - 1)

    if (results?.error?.includes('We detected that the Chrome process just crashed with code')) {
      // If the browser has crashed, make sure isFirstSpecInBrowser is set to true as the browser will be relaunching
      isFirstSpecInBrowser = true
    } else {
      isFirstSpecInBrowser = false
    }

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

  const results: CypressRunResult = {
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
    config,
  }

  const afterRunSpan = telemetry.startSpan({ name: 'lifecycle:after:run' })

  const publicResults = createPublicRunResults(results)

  debug('final results of all runs: %o', publicResults)

  await runEvents.execute('after:run', publicResults)
  afterRunSpan?.end()

  await writeOutput(outputPath, publicResults)
  runSpan?.end()

  return results
}

async function runSpec (config, spec: SpecWithRelativeRoot, options: { project: Project, browser: Browser, onError: (err: Error) => void, config: Cfg, quiet: boolean, exit: boolean, testingType: TestingType, socketId: string, webSecurity: boolean, projectRoot: string, protocolManager?: ProtocolManager } & Pick<Cfg, 'video' | 'videosFolder' | 'videoCompression'>, estimated, isFirstSpecInBrowser, isLastSpec) {
  const { project, browser, onError } = options

  const { isHeadless } = browser

  debug('about to run spec %o', {
    spec: createPublicSpec(spec),
    isHeadless,
    browser: createPublicBrowser(browser),
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

    if (config.experimentalSingleTabRunMode && !isFirstSpecInBrowser && project.videoRecording) {
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
      quiet: options.quiet,
      shouldKeepTabOpen: !isLastSpec,
      isLastSpec,
      protocolManager: options.protocolManager,
    }),
    waitForBrowserToConnect({
      spec,
      project,
      browser,
      screenshots,
      onError: (...args) => {
        debug('onError from runSpec')
        onError(...args)
      },
      videoRecording,
      socketId: options.socketId,
      webSecurity: options.webSecurity,
      projectRoot: options.projectRoot,
      testingType: options.testingType,
      isFirstSpecInBrowser,
      experimentalSingleTabRunMode: config.experimentalSingleTabRunMode,
      shouldLaunchNewTab: !isFirstSpecInBrowser,
      protocolManager: options.protocolManager,
    }),
  ])

  return { results }
}

interface ReadyOptions {
  autoCancelAfterFailures: number | false
  browser: string
  browsers?: FoundBrowser[]
  ciBuildId: string
  exit: boolean
  group: string
  headed: boolean
  key: string
  onError?: (err: Error) => void
  outputPath: string
  parallel: boolean
  projectRoot: string
  quiet: boolean
  record: boolean
  socketId: string
  spec: string | RegExp | string[]
  tag: string
  testingType: TestingType
  webSecurity: boolean
}

async function ready (options: ReadyOptions) {
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

  const onError = options.onError = (err) => {
    debug('onError', new Error().stack)
    earlyExitTerminator.exitEarly(err)
  }

  // alias and coerce to null
  let specPatternFromCli = options.spec || null

  // ensure the project exists
  // and open up the project
  const browsers = await browserUtils.get()

  debug('found all system browsers %o', browsers.map(createPublicBrowser))
  // TODO: refactor this so we don't need to extend options
  options.browsers = browsers

  const { project, projectId, config, configFile } = await createAndOpenProject(options)

  debug('project created and opened with config %o', createPublicConfig(config))

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

  async function runAllSpecs ({ beforeSpecRun, afterSpecRun, runUrl, parallel }: { beforeSpecRun?: BeforeSpecRun, afterSpecRun?: AfterSpecRun, runUrl?: string, parallel?: boolean }) {
    const results = await runSpecs({
      autoCancelAfterFailures,
      beforeSpecRun,
      afterSpecRun,
      projectRoot,
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
      specPattern,
      videosFolder: config.videosFolder,
      video: config.video,
      videoCompression: config.videoCompression,
      headed: options.headed,
      quiet: options.quiet,
      outputPath: options.outputPath,
      testingType: options.testingType,
      exit: options.exit,
      webSecurity: options.webSecurity,
      protocolManager: project.protocolManager,
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
  debug('run start')
  // Check if running as electron process
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
    debug('caught outer error', e)

    return earlyExitTerminator.exitEarly(e)
  }
}
