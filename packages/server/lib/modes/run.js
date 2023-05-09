"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const tslib_1 = require("tslib");
/* eslint-disable no-console, @cypress/dev/arrow-body-multiline-braces */
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const root_1 = tslib_1.__importDefault(require("@packages/root"));
const path_1 = tslib_1.__importDefault(require("path"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const assert_1 = tslib_1.__importDefault(require("assert"));
const record_1 = tslib_1.__importDefault(require("./record"));
const errors = tslib_1.__importStar(require("../errors"));
const reporter_1 = tslib_1.__importDefault(require("../reporter"));
const browsers_1 = tslib_1.__importDefault(require("../browsers"));
const open_project_1 = require("../open_project");
const videoCapture = tslib_1.__importStar(require("../video_capture"));
const fs_1 = require("../util/fs");
const run_events_1 = tslib_1.__importDefault(require("../plugins/run_events"));
const env_1 = tslib_1.__importDefault(require("../util/env"));
const trash_1 = tslib_1.__importDefault(require("../util/trash"));
const random_1 = tslib_1.__importDefault(require("../util/random"));
const system_1 = tslib_1.__importDefault(require("../util/system"));
const chrome_policy_check_1 = tslib_1.__importDefault(require("../util/chrome_policy_check"));
const objUtils = tslib_1.__importStar(require("../util/obj_utils"));
const printResults = tslib_1.__importStar(require("../util/print-run"));
const telemetry_1 = require("@packages/telemetry");
let exitEarly = (err) => {
    debug('set early exit error: %s', err.stack);
    earlyExitErr = err;
};
let earlyExitErr;
let currentSetScreenshotMetadata;
const debug = (0, debug_1.default)('cypress:server:run');
const DELAY_TO_LET_VIDEO_FINISH_MS = 1000;
const relativeSpecPattern = (projectRoot, pattern) => {
    if (typeof pattern === 'string') {
        return pattern.replace(`${projectRoot}/`, '');
    }
    return pattern.map((x) => x.replace(`${projectRoot}/`, ''));
};
const iterateThroughSpecs = function (options) {
    const { specs, runEachSpec, beforeSpecRun, afterSpecRun, config } = options;
    const serial = () => {
        return bluebird_1.default.mapSeries(specs, runEachSpec);
    };
    const ranSpecs = [];
    async function parallelAndSerialWithRecord(runs) {
        const { spec, claimedInstances, totalInstances, estimated } = await beforeSpecRun();
        // no more specs to run? then we're done!
        if (!spec)
            return runs;
        // find the actual spec object amongst
        // our specs array since the API sends us
        // the relative name
        const specObject = lodash_1.default.find(specs, { relative: spec });
        if (!specObject)
            throw new Error(`Unable to find specObject for spec '${spec}'`);
        ranSpecs.push(specObject);
        const results = await runEachSpec(specObject, claimedInstances - 1, totalInstances, estimated);
        runs.push(results);
        await afterSpecRun(specObject, results, config);
        // recurse
        return parallelAndSerialWithRecord(runs);
    }
    if (beforeSpecRun) {
        // if we are running in parallel
        // then ask the server for the next spec
        return parallelAndSerialWithRecord([]);
    }
    // else iterate in serial
    return serial();
};
async function getProjectId(project, id) {
    if (id == null) {
        id = env_1.default.get('CYPRESS_PROJECT_ID');
    }
    // if we have an ID just use it
    if (id)
        return id;
    try {
        return project.getProjectId();
    }
    catch (err) {
        // no id no problem
        return null;
    }
}
const sumByProp = (runs, prop) => {
    return lodash_1.default.sumBy(runs, prop) || 0;
};
const getRun = (run, prop) => {
    return lodash_1.default.get(run, prop);
};
async function writeOutput(outputPath, results) {
    if (!outputPath) {
        return;
    }
    debug('saving output results %o', { outputPath });
    return fs_1.fs.outputJson(outputPath, results);
}
const onWarning = (err) => {
    console.log(chalk_1.default.yellow(err.message));
};
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
    };
    return open_project_1.openProject.create(projectRoot, args, options);
};
async function checkAccess(folderPath) {
    return fs_1.fs.access(folderPath, fs_1.fs.constants.W_OK).catch((err) => {
        if (['EACCES', 'EPERM', 'EROFS'].includes(err.code)) {
            // we cannot write due to folder permissions, or read-only filesystem
            return errors.warning('FOLDER_NOT_WRITABLE', folderPath);
        }
        throw err;
    });
}
const createAndOpenProject = async (options) => {
    const { projectRoot, projectId, socketId } = options;
    await checkAccess(projectRoot);
    const open_project = await openProjectCreate(projectRoot, socketId, options);
    const project = open_project.getProject();
    if (!project)
        throw new Error('Missing project after openProjectCreate!');
    const [config, _projectId] = await Promise.all([
        project.getConfig(),
        getProjectId(project, projectId),
    ]);
    return {
        project,
        config,
        projectId: _projectId,
        // Lazy require'd here, so as to not execute until we're in the electron process
        configFile: require('@packages/data-context').getCtx().lifecycleManager.configFile,
    };
};
const removeOldProfiles = (browser) => {
    return browsers_1.default.removeOldProfiles(browser)
        .catch((err) => {
        // dont make removing old browsers profiles break the build
        return errors.warning('CANNOT_REMOVE_OLD_BROWSER_PROFILES', err);
    });
};
async function trashAssets(config) {
    if (config.trashAssetsBeforeRuns !== true) {
        return;
    }
    try {
        await Promise.all([
            trash_1.default.folder(config.videosFolder),
            trash_1.default.folder(config.screenshotsFolder),
            trash_1.default.folder(config.downloadsFolder),
        ]);
    }
    catch (err) {
        // dont make trashing assets fail the build
        errors.warning('CANNOT_TRASH_ASSETS', err);
    }
}
async function startVideoRecording(options) {
    var _a;
    if (!options.videosFolder)
        throw new Error('Missing videoFolder for recording');
    function videoPath(suffix) {
        return path_1.default.join(options.videosFolder, options.spec.relativeToCommonRoot + suffix);
    }
    const videoName = videoPath('.mp4');
    const compressedVideoName = videoPath('-compressed.mp4');
    const outputDir = path_1.default.dirname(videoName);
    const onError = lodash_1.default.once((err) => {
        // catch video recording failures and log them out
        // but don't let this affect the run at all
        errors.warning('VIDEO_RECORDING_FAILED', err);
        return undefined;
    });
    try {
        await fs_1.fs.ensureDir(outputDir);
    }
    catch (err) {
        onError(err);
    }
    if (options.previous) {
        debug('in single-tab mode, re-using previous videoController');
        Object.assign(options.previous.api, {
            videoName,
            compressedVideoName,
            onError,
        });
        await ((_a = options.previous.controller) === null || _a === void 0 ? void 0 : _a.restart().catch(onError));
        return options.previous;
    }
    let ffmpegController;
    let _ffmpegOpts;
    const videoRecording = {
        api: {
            onError,
            videoName,
            compressedVideoName,
            async useFfmpegVideoController(ffmpegOpts) {
                _ffmpegOpts = ffmpegOpts || _ffmpegOpts;
                ffmpegController = await videoCapture.start({ ...videoRecording.api, ..._ffmpegOpts });
                // This wrapper enables re-binding writeVideoFrame to a new video stream when running in single-tab mode.
                const controllerWrap = {
                    ...ffmpegController,
                    writeVideoFrame: function writeVideoFrameWrap(data) {
                        if (!ffmpegController)
                            throw new Error('missing ffmpegController in writeVideoFrameWrap');
                        ffmpegController.writeVideoFrame(data);
                    },
                    async restart() {
                        await videoRecording.api.useFfmpegVideoController(_ffmpegOpts);
                    },
                };
                videoRecording.api.useVideoController(controllerWrap);
                return controllerWrap;
            },
            useVideoController(videoController) {
                debug('setting videoController for videoRecording %o', videoRecording);
                videoRecording.controller = videoController;
            },
            onProjectCaptureVideoFrames(fn) {
                options.project.on('capture:video:frames', fn);
            },
        },
        controller: undefined,
    };
    options.project.videoRecording = videoRecording;
    debug('created videoRecording %o', { videoRecording });
    return videoRecording;
}
const warnVideoRecordingFailed = (err) => {
    // log that post processing was attempted
    // but failed and don't let this change the run exit code
    errors.warning('VIDEO_POST_PROCESSING_FAILED', err);
};
async function postProcessRecording(options) {
    debug('ending the video recording %o', options);
    // once this ended promises resolves
    // then begin processing the file
    // don't process anything if videoCompress is off
    // or we've been told not to upload the video
    if (options.videoCompression === false || options.videoCompression === 0 || options.shouldUploadVideo === false) {
        return;
    }
    const processOptions = {
        ...options.processOptions,
        videoCompression: Number(options.videoCompression),
    };
    function continueProcessing(onProgress) {
        return videoCapture.process({ ...processOptions, onProgress });
    }
    if (options.quiet) {
        return continueProcessing();
    }
    const { onProgress } = printResults.displayVideoProcessingProgress(processOptions);
    return continueProcessing(onProgress);
}
function launchBrowser(options) {
    var _a;
    const { browser, spec, setScreenshotMetadata, screenshots, projectRoot, shouldLaunchNewTab, onError } = options;
    const warnings = {};
    const browserOpts = {
        projectRoot,
        shouldLaunchNewTab,
        onError,
        videoApi: (_a = options.videoRecording) === null || _a === void 0 ? void 0 : _a.api,
        automationMiddleware: {
            onBeforeRequest(message, data) {
                if (message === 'take:screenshot') {
                    return setScreenshotMetadata(data);
                }
            },
            onAfterResponse: (message, data, resp) => {
                if (message === 'take:screenshot' && resp) {
                    const existingScreenshot = lodash_1.default.findIndex(screenshots, { path: resp.path });
                    if (existingScreenshot !== -1) {
                        // NOTE: saving screenshots to the same path will overwrite the previous one
                        // so we shouldn't report more screenshots than exist on disk.
                        // this happens when cy.screenshot is used in a retried test
                        screenshots.splice(existingScreenshot, 1, screenshotMetadata(data, resp));
                    }
                    else {
                        screenshots.push(screenshotMetadata(data, resp));
                    }
                }
                return resp;
            },
        },
        onWarning: (err) => {
            const { message } = err;
            // if this warning has already been
            // seen for this browser launch then
            // suppress it
            if (warnings[message])
                return;
            warnings[message] = err;
        },
    };
    return open_project_1.openProject.launch(browser, spec, browserOpts);
}
function listenForProjectEnd(project, exit) {
    var _a;
    if ((_a = globalThis.CY_TEST_MOCK) === null || _a === void 0 ? void 0 : _a.listenForProjectEnd)
        return bluebird_1.default.resolve(globalThis.CY_TEST_MOCK.listenForProjectEnd);
    return new bluebird_1.default((resolve, reject) => {
        if (exit === false) {
            resolve = () => {
                console.log('not exiting due to options.exit being false');
            };
        }
        const onEarlyExit = function (err) {
            if (err.isFatalApiErr) {
                return reject(err);
            }
            console.log('');
            errors.log(err);
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
            };
            return resolve(obj);
        };
        project.once('end', (results) => resolve(results));
        // if we already received a reason to exit early, go ahead and do it
        if (earlyExitErr) {
            return onEarlyExit(earlyExitErr);
        }
        // otherwise override exitEarly so we exit as soon as there is a reason
        exitEarly = (err) => {
            onEarlyExit(err);
        };
    });
}
async function waitForBrowserToConnect(options) {
    var _a;
    if ((_a = globalThis.CY_TEST_MOCK) === null || _a === void 0 ? void 0 : _a.waitForBrowserToConnect)
        return Promise.resolve();
    const { project, socketId, onError, spec } = options;
    const browserTimeout = Number(process.env.CYPRESS_INTERNAL_BROWSER_CONNECT_TIMEOUT || 60000);
    let browserLaunchAttempt = 1;
    // without this the run mode is only setting new spec
    // path for next spec in launch browser.
    // we need it to run on every spec even in single browser mode
    currentSetScreenshotMetadata = (data) => {
        data.specName = spec.relativeToCommonRoot;
        return data;
    };
    // TODO: remove the need to extend options and avoid the type error
    // @ts-expect-error
    options.setScreenshotMetadata = (data) => {
        return currentSetScreenshotMetadata(data);
    };
    if (options.experimentalSingleTabRunMode && options.testingType === 'component' && !options.isFirstSpec) {
        // reset browser state to match default behavior when opening/closing a new tab
        await open_project_1.openProject.resetBrowserState();
        // Send the new telemetry context to the browser to set the parent/child relationship appropriately for tests
        if (telemetry_1.telemetry.isEnabled()) {
            open_project_1.openProject.updateTelemetryContext(JSON.stringify(telemetry_1.telemetry.getActiveContextObject()));
        }
        // since we aren't re-launching the browser, we have to navigate to the next spec instead
        debug('navigating to next spec %s', spec);
        return open_project_1.openProject.changeUrlToSpec(spec);
    }
    const wait = async () => {
        telemetry_1.telemetry.startSpan({ name: `waitForBrowserToConnect:attempt:${browserLaunchAttempt}` });
        debug('waiting for socket to connect and browser to launch...');
        return bluebird_1.default.all([
            waitForSocketConnection(project, socketId),
            // TODO: remove the need to extend options and coerce this type
            launchBrowser(options),
        ])
            .timeout(browserTimeout)
            .then(() => {
            var _a;
            (_a = telemetry_1.telemetry.getSpan(`waitForBrowserToConnect:attempt:${browserLaunchAttempt}`)) === null || _a === void 0 ? void 0 : _a.end();
        })
            .catch(bluebird_1.default.TimeoutError, async (err) => {
            var _a;
            (_a = telemetry_1.telemetry.getSpan(`waitForBrowserToConnect:attempt:${browserLaunchAttempt}`)) === null || _a === void 0 ? void 0 : _a.end();
            console.log('');
            // always first close the open browsers
            // before retrying or dieing
            await open_project_1.openProject.closeBrowser();
            if (browserLaunchAttempt === 1 || browserLaunchAttempt === 2) {
                // try again up to 3 attempts
                const word = browserLaunchAttempt === 1 ? 'Retrying...' : 'Retrying again...';
                errors.warning('TESTS_DID_NOT_START_RETRYING', word);
                browserLaunchAttempt += 1;
                return await wait();
            }
            err = errors.get('TESTS_DID_NOT_START_FAILED');
            errors.log(err);
            onError(err);
        });
    };
    return wait();
}
function waitForSocketConnection(project, id) {
    var _a;
    if ((_a = globalThis.CY_TEST_MOCK) === null || _a === void 0 ? void 0 : _a.waitForSocketConnection)
        return;
    debug('waiting for socket connection... %o', { id });
    return new Promise((resolve, reject) => {
        const fn = function (socketId) {
            debug('got socket connection %o', { id: socketId });
            if (socketId === id) {
                // remove the event listener if we've connected
                project.removeListener('socket:connected', fn);
                debug('socket connected', { socketId });
                // resolve the promise
                return resolve();
            }
        };
        // when a socket connects verify this
        // is the one that matches our id!
        return project.on('socket:connected', fn);
    });
}
async function waitForTestsToFinishRunning(options) {
    var _a, _b, _c;
    if ((_a = globalThis.CY_TEST_MOCK) === null || _a === void 0 ? void 0 : _a.waitForTestsToFinishRunning)
        return Promise.resolve(globalThis.CY_TEST_MOCK.waitForTestsToFinishRunning);
    const { project, screenshots, videoRecording, videoCompression, videoUploadOnPasses, exit, spec, estimated, quiet, config, shouldKeepTabOpen, testingType } = options;
    const results = await listenForProjectEnd(project, exit);
    debug('received project end %o', results);
    // https://github.com/cypress-io/cypress/issues/2370
    // delay 1 second if we're recording a video to give
    // the browser padding to render the final frames
    // to avoid chopping off the end of the video
    const videoController = videoRecording === null || videoRecording === void 0 ? void 0 : videoRecording.controller;
    debug('received videoController %o', { videoController });
    if (videoController) {
        const span = telemetry_1.telemetry.startSpan({ name: 'video:capture:delayToLetFinish' });
        debug('delaying to extend video %o', { DELAY_TO_LET_VIDEO_FINISH_MS });
        await bluebird_1.default.delay(DELAY_TO_LET_VIDEO_FINISH_MS);
        span === null || span === void 0 ? void 0 : span.end();
    }
    lodash_1.default.defaults(results, {
        error: null,
        hooks: null,
        tests: null,
        video: null,
        screenshots: null,
        reporterStats: null,
    });
    // Cypress Cloud told us to skip this spec
    const skippedSpec = results.skippedSpec;
    if (screenshots) {
        results.screenshots = screenshots;
    }
    results.spec = spec;
    const { tests, stats } = results;
    const attempts = lodash_1.default.flatMap(tests, (test) => test.attempts);
    let videoCaptureFailed = false;
    // if we have a video recording
    if (videoController) {
        results.video = videoRecording.api.videoName;
        if (tests && tests.length) {
            // always set the video timestamp on tests
            reporter_1.default.setVideoTimestamp(videoController.startedVideoCapture, attempts);
        }
        try {
            await videoController.endVideoCapture();
            debug('ended video capture');
        }
        catch (err) {
            videoCaptureFailed = true;
            warnVideoRecordingFailed(err);
        }
        (_c = (_b = telemetry_1.telemetry.getSpan('video:capture')) === null || _b === void 0 ? void 0 : _b.setAttributes({ videoCaptureFailed })) === null || _c === void 0 ? void 0 : _c.end();
    }
    const afterSpecSpan = telemetry_1.telemetry.startSpan({ name: 'lifecycle:after:spec' });
    debug('execute after:spec');
    await run_events_1.default.execute('after:spec', spec, results);
    afterSpecSpan === null || afterSpecSpan === void 0 ? void 0 : afterSpecSpan.end();
    const videoName = videoRecording === null || videoRecording === void 0 ? void 0 : videoRecording.api.videoName;
    const videoExists = videoName && await fs_1.fs.pathExists(videoName);
    if (!videoExists) {
        // the video file no longer exists at the path where we expect it,
        // possibly because the user deleted it in the after:spec event
        debug(`No video found after spec ran - skipping processing. Video path: ${videoName}`);
        results.video = null;
    }
    const hasFailingTests = lodash_1.default.get(stats, 'failures') > 0;
    // we should upload the video if we upload on passes (by default)
    // or if we have any failures and have started the video
    const shouldUploadVideo = !skippedSpec && videoUploadOnPasses === true || Boolean(( /* startedVideoCapture */videoExists && hasFailingTests));
    results.shouldUploadVideo = shouldUploadVideo;
    if (!shouldUploadVideo) {
        debug(`Spec run had no failures and config.videoUploadOnPasses=false. Skip processing video. Video path: ${videoName}`);
        results.video = null;
    }
    if (!quiet && !skippedSpec) {
        printResults.displayResults(results, estimated);
    }
    // @ts-expect-error experimentalSingleTabRunMode only exists on the CT-specific config type
    const usingExperimentalSingleTabMode = testingType === 'component' && config.experimentalSingleTabRunMode;
    if (usingExperimentalSingleTabMode) {
        await project.server.destroyAut();
    }
    // we do not support experimentalSingleTabRunMode for e2e
    if (!usingExperimentalSingleTabMode) {
        debug('attempting to close the browser tab');
        await open_project_1.openProject.resetBrowserTabsForNextTest(shouldKeepTabOpen);
        debug('resetting server state');
        project.server.reset();
    }
    if (videoExists && !skippedSpec && !videoCaptureFailed) {
        const span = telemetry_1.telemetry.startSpan({ name: 'video:post:processing' });
        const chaptersConfig = videoCapture.generateFfmpegChaptersConfig(results.tests);
        try {
            debug('post processing recording');
            span === null || span === void 0 ? void 0 : span.setAttributes({
                videoName,
                videoCompressionString: videoCompression.toString(),
                compressedVideoName: videoRecording.api.compressedVideoName,
            });
            await postProcessRecording({
                shouldUploadVideo,
                quiet,
                videoCompression,
                processOptions: {
                    compressedVideoName: videoRecording.api.compressedVideoName,
                    videoName,
                    chaptersConfig,
                    ...(videoRecording.controller.postProcessFfmpegOptions || {}),
                },
            });
        }
        catch (err) {
            videoCaptureFailed = true;
            warnVideoRecordingFailed(err);
        }
        span === null || span === void 0 ? void 0 : span.end();
    }
    if (videoCaptureFailed) {
        results.video = null;
    }
    return results;
}
function screenshotMetadata(data, resp) {
    return {
        screenshotId: random_1.default.id(),
        name: data.name || null,
        testId: data.testId,
        testAttemptIndex: data.testAttemptIndex,
        takenAt: resp.takenAt,
        path: resp.path,
        height: resp.dimensions.height,
        width: resp.dimensions.width,
        pathname: undefined,
    };
}
async function runSpecs(options) {
    var _a;
    if ((_a = globalThis.CY_TEST_MOCK) === null || _a === void 0 ? void 0 : _a.runSpecs)
        return globalThis.CY_TEST_MOCK.runSpecs;
    const { config, browser, sys, headed, outputPath, specs, specPattern, beforeSpecRun, afterSpecRun, runUrl, parallel, group, tag, autoCancelAfterFailures } = options;
    const isHeadless = !headed;
    browser.isHeadless = isHeadless;
    browser.isHeaded = !isHeadless;
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
        });
    }
    let isFirstSpec = true;
    async function runEachSpec(spec, index, length, estimated) {
        const span = telemetry_1.telemetry.startSpan({
            name: 'run:spec',
            active: true,
        });
        span === null || span === void 0 ? void 0 : span.setAttributes({
            specName: spec.name,
            type: spec.specType,
            firstSpec: isFirstSpec,
        });
        if (!options.quiet) {
            printResults.displaySpecHeader(spec.relativeToCommonRoot, index + 1, length, estimated);
        }
        const { results } = await runSpec(config, spec, options, estimated, isFirstSpec, index === length - 1);
        isFirstSpec = false;
        debug('spec results %o', results);
        span === null || span === void 0 ? void 0 : span.end();
        return results;
    }
    const beforeRunDetails = {
        browser,
        config,
        cypressVersion: root_1.default.version,
        group,
        parallel,
        runUrl,
        specs,
        specPattern,
        system: lodash_1.default.pick(sys, 'osName', 'osVersion'),
        tag,
        autoCancelAfterFailures,
    };
    const runSpan = telemetry_1.telemetry.startSpan({ name: 'run' });
    runSpan === null || runSpan === void 0 ? void 0 : runSpan.setAttributes({
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
    });
    const beforeRunSpan = telemetry_1.telemetry.startSpan({ name: 'lifecycle:before:run' });
    await run_events_1.default.execute('before:run', beforeRunDetails);
    beforeRunSpan === null || beforeRunSpan === void 0 ? void 0 : beforeRunSpan.end();
    const runs = await iterateThroughSpecs({
        specs,
        config,
        runEachSpec,
        afterSpecRun,
        beforeSpecRun,
    });
    const results = {
        status: 'finished',
        startedTestsAt: getRun(lodash_1.default.first(runs), 'stats.wallClockStartedAt'),
        endedTestsAt: getRun(lodash_1.default.last(runs), 'stats.wallClockEndedAt'),
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
        cypressVersion: root_1.default.version,
        runUrl,
        // @ts-expect-error slight type mismatch in public types vs internal types
        config,
    };
    debug('final results of all runs: %o', results);
    const { each, remapKeys, remove, renameKey, setValue } = objUtils;
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
                    screenshots: setValue((0, lodash_1.default)(run.screenshots)
                        .filter({ testId: test.testId, testAttemptIndex: i })
                        .map((screenshot) => lodash_1.default.omit(screenshot, ['screenshotId', 'testId', 'testAttemptIndex']))
                        .value()),
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
    });
    const afterRunSpan = telemetry_1.telemetry.startSpan({ name: 'lifecycle:after:run' });
    await run_events_1.default.execute('after:run', moduleAPIResults);
    afterRunSpan === null || afterRunSpan === void 0 ? void 0 : afterRunSpan.end();
    await writeOutput(outputPath, moduleAPIResults);
    runSpan === null || runSpan === void 0 ? void 0 : runSpan.end();
    return results;
}
async function runSpec(config, spec, options, estimated, isFirstSpec, isLastSpec) {
    const { project, browser, onError } = options;
    const { isHeadless } = browser;
    debug('about to run spec %o', {
        spec,
        isHeadless,
        browser,
    });
    if (browser.family !== 'chromium' && !options.config.chromeWebSecurity) {
        console.log('');
        errors.warning('CHROME_WEB_SECURITY_NOT_SUPPORTED', browser.family);
    }
    const screenshots = [];
    async function getVideoRecording() {
        if (!options.video)
            return undefined;
        const opts = { project, spec, videosFolder: options.videosFolder };
        telemetry_1.telemetry.startSpan({ name: 'video:capture' });
        if (config.experimentalSingleTabRunMode && !isFirstSpec && project.videoRecording) {
            // in single-tab mode, only the first spec needs to create a videoRecording object
            // which is then re-used between specs
            return await startVideoRecording({ ...opts, previous: project.videoRecording });
        }
        return await startVideoRecording(opts);
    }
    const videoRecording = await getVideoRecording();
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
    ]);
    return { results };
}
async function ready(options) {
    debug('run mode ready with options %o', options);
    if (process.env.ELECTRON_RUN_AS_NODE && !process.env.DISPLAY) {
        debug('running electron as a node process without xvfb');
    }
    lodash_1.default.defaults(options, {
        isTextTerminal: true,
        browser: 'electron',
        quiet: false,
    });
    const { projectRoot, record, key, ciBuildId, parallel, group, browser: browserName, tag, testingType, socketId, autoCancelAfterFailures } = options;
    (0, assert_1.default)(socketId);
    // this needs to be a closure over `exitEarly` and not a reference
    // because `exitEarly` gets overwritten in `listenForProjectEnd`
    // TODO: refactor this so we don't need to extend options
    const onError = options.onError = (err) => exitEarly(err);
    // alias and coerce to null
    let specPatternFromCli = options.spec || null;
    // ensure the project exists
    // and open up the project
    const browsers = await browsers_1.default.get();
    debug('found all system browsers %o', browsers);
    // TODO: refactor this so we don't need to extend options
    options.browsers = browsers;
    const { project, projectId, config, configFile } = await createAndOpenProject(options);
    debug('project created and opened with config %o', config);
    // if we have a project id and a key but record hasnt been given
    record_1.default.warnIfProjectIdButNoRecordOption(projectId, options);
    record_1.default.throwIfRecordParamsWithoutRecording(record, ciBuildId, parallel, group, tag, autoCancelAfterFailures);
    if (record) {
        record_1.default.throwIfNoProjectId(projectId, configFile);
        record_1.default.throwIfIncorrectCiBuildIdUsage(ciBuildId, parallel, group);
        record_1.default.throwIfIndeterminateCiBuildId(ciBuildId, parallel, group);
    }
    // user code might have modified list of allowed browsers
    // but be defensive about it
    const userBrowsers = lodash_1.default.get(config, 'resolved.browsers.value', browsers);
    let specPattern = specPatternFromCli || config.specPattern;
    specPattern = relativeSpecPattern(projectRoot, specPattern);
    const [sys, browser] = await Promise.all([
        system_1.default.info(),
        (async () => {
            const browser = await browsers_1.default.ensureAndGetByNameOrPath(browserName, false, userBrowsers);
            await removeOldProfiles(browser);
            return browser;
        })(),
        trashAssets(config),
    ]);
    // @ts-expect-error ctx is protected
    const specs = project.ctx.project.specs;
    if (!specs.length) {
        errors.throwErr('NO_SPECS_FOUND', projectRoot, String(specPattern));
    }
    if (browser.unsupportedVersion && browser.warning) {
        errors.throwErr('UNSUPPORTED_BROWSER_VERSION', browser.warning);
    }
    if (browser.family === 'chromium') {
        chrome_policy_check_1.default.run(onWarning);
    }
    async function runAllSpecs({ beforeSpecRun, afterSpecRun, runUrl, parallel }) {
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
        });
        if (!options.quiet) {
            printResults.renderSummaryTable(runUrl, results);
            printResults.maybeLogCloudRecommendationMessage(results.runs || [], record);
        }
        return results;
    }
    if (record) {
        const { projectName } = config;
        return record_1.default.createRunAndRecordSpecs({
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
        });
    }
    // not recording, can't be parallel
    return runAllSpecs({
        parallel: false,
    });
}
async function run(options, loading) {
    var _a;
    if (require('../util/electron-app').isRunningAsElectronProcess({ debug })) {
        const app = require('electron').app;
        // electron >= 5.0.0 will exit the app if all browserwindows are closed,
        // this is obviously undesirable in run mode
        // https://github.com/cypress-io/cypress/pull/4720#issuecomment-514316695
        app.on('window-all-closed', () => {
            debug('all BrowserWindows closed, not exiting');
        });
        (_a = telemetry_1.telemetry.getSpan('binary:startup')) === null || _a === void 0 ? void 0 : _a.end();
        await app.whenReady();
    }
    await loading;
    try {
        return ready(options);
    }
    catch (e) {
        return exitEarly(e);
    }
}
exports.run = run;
