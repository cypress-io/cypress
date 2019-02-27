/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _          = require("lodash");
const pkg        = require("@packages/root");
const path       = require("path");
const chalk      = require("chalk");
const human      = require("human-interval");
const debug      = require("debug")("cypress:server:run");
const Promise    = require("bluebird");
const logSymbols = require("log-symbols");

const recordMode = require("./record");
const errors     = require("../errors");
const Project    = require("../project");
const Reporter   = require("../reporter");
const browsers   = require("../browsers");
const openProject = require("../open_project");
const videoCapture = require("../video_capture");
const Windows    = require("../gui/windows");
const fs         = require("../util/fs");
const env        = require("../util/env");
const trash      = require("../util/trash");
const random     = require("../util/random");
const system     = require("../util/system");
const duration   = require("../util/duration");
const terminal   = require("../util/terminal");
const specsUtil  = require("../util/specs");
const humanTime  = require("../util/human_time");
const electronApp = require("../util/electron_app");

const color = (val, c) => chalk[c](val);

const gray = val => color(val, "gray");

const colorIf = function(val, c) {
  if (val === 0) {
    val = "-";
    c = "gray";
  }

  return color(val, c);
};

const getSymbol = function(num) {
  if (num) { return logSymbols.error; } else { return logSymbols.success; }
};

const formatBrowser = browser =>
  //# todo finish browser
  _.compact([
    browser.displayName,
    browser.majorVersion,
    browser.isHeadless && gray("(headless)")
  ]).join(" ")
;

const formatFooterSummary = function(results) {
  const { totalFailed, runs } = results;

  //# pass or fail color
  const c = totalFailed ? "red" : "green";

  const phrase = (function() {
    //# if we have any specs failing...
    if (!totalFailed) {
      return "All specs passed!";
    }

    //# number of specs
    const total = runs.length;
    const failingRuns = _.filter(runs, "stats.failures").length;
    const percent = Math.round((failingRuns / total) * 100);

    return `${failingRuns} of ${total} failed (${percent}%)`;
  })();

  return [
    color(phrase, c),
    gray(duration.format(results.totalDuration)),
    colorIf(results.totalTests, "reset"),
    colorIf(results.totalPassed, "green"),
    colorIf(totalFailed, "red"),
    colorIf(results.totalPending, "cyan"),
    colorIf(results.totalSkipped, "blue"),
  ];
};

const formatSpecSummary = (name, failures) =>
  [
    getSymbol(failures),
    color(name, "reset")
  ]
  .join(" ")
;

const formatRecordParams = function(runUrl, parallel, group) {
  if (runUrl) {
    if (!group) { group = false; }
    return `Group: ${group}, Parallel: ${Boolean(parallel)}`;
  }
};

const formatSpecPattern = function(specPattern) {
  if (specPattern) {
    return specPattern.join(", ");
  }
};

const formatSpecs = function(specs) {
  const names = _.map(specs, "name");

  //# 25 found: (foo.spec.js, bar.spec.js, baz.spec.js)
  return [
    `${names.length} found `,
    gray("("),
    gray(names.join(', ')),
    gray(")")
  ]
  .join("");
};

const displayRunStarting = function(options = {}) {
  const { specs, specPattern, browser, runUrl, parallel, group } = options;

  console.log("");

  terminal.divider("=");

  console.log("");

  terminal.header("Run Starting", {
    color: ["reset"]
  });

  console.log("");

  const table = terminal.table({
    colWidths: [12, 88],
    type: "outsideBorder"
  });

  const data = _
  .chain([
    [gray("Cypress:"), pkg.version],
    [gray("Browser:"), formatBrowser(browser)],
    [gray("Specs:"), formatSpecs(specs)],
    [gray("Searched:"), formatSpecPattern(specPattern)],
    [gray("Params:"), formatRecordParams(runUrl, parallel, group)],
    [gray("Run URL:"), runUrl]
  ])
  .filter(_.property(1))
  .value();

  table.push(...data);

  console.log(table.toString());

  return console.log("");
};

const displaySpecHeader = function(name, curr, total, estimated) {
  console.log("");

  const PADDING = 2;

  const table = terminal.table({
    colWidths: [80, 20],
    colAligns: ["left", "right"],
    type: "pageDivider",
    style: {
      "padding-left": PADDING
    }
  });

  table.push(["", ""]);
  table.push([
    `Running: ${gray(name + "...")}`,
    gray(`(${curr} of ${total})`)
  ]);

  console.log(table.toString());

  if (estimated) {
    const estimatedLabel = " ".repeat(PADDING) + "Estimated:";
    return console.log(estimatedLabel, gray(humanTime.long(estimated)));
  }
};

const collectTestResults = (obj = {}, estimated) =>
  ({
    name:        _.get(obj, 'spec.name'),
    tests:       _.get(obj, 'stats.tests'),
    passes:      _.get(obj, 'stats.passes'),
    pending:     _.get(obj, 'stats.pending'),
    failures:    _.get(obj, 'stats.failures'),
    skipped:     _.get(obj, 'stats.skipped' ),
    duration:    humanTime.long(_.get(obj, 'stats.wallClockDuration')),
    estimated:   estimated && humanTime.long(estimated),
    screenshots: obj.screenshots && obj.screenshots.length,
    video:       Boolean(obj.video)
  })
;

const renderSummaryTable = runUrl => function(results) {
  const { runs } = results;

  console.log("");

  terminal.divider("=");

  console.log("");

  terminal.header("Run Finished", {
    color: ["reset"]
  });

  if (runs && runs.length) {
    const head =      ["  Spec", "", "Tests", "Passing", "Failing", "Pending", "Skipped"];
    const colAligns = ["left", "right", "right", "right", "right", "right", "right"];
    const colWidths = [39, 11, 10, 10, 10, 10, 10];

    const table1 = terminal.table({
      colAligns,
      colWidths,
      type: "noBorder",
      head: _.map(head, gray)
    });

    const table2 = terminal.table({
      colAligns,
      colWidths,
      type: "border"
    });

    const table3 = terminal.table({
      colAligns,
      colWidths,
      type: "noBorder",
      head: formatFooterSummary(results),
      style: {
        "padding-right": 2
      }
    });

    _.each(runs, function(run) {
      const { spec, stats } = run;

      const ms = duration.format(stats.wallClockDuration);

      return table2.push([
        formatSpecSummary(spec.name, stats.failures),
        color(ms, "gray"),
        colorIf(stats.tests, "reset"),
        colorIf(stats.passes, "green"),
        colorIf(stats.failures, "red"),
        colorIf(stats.pending, "cyan"),
        colorIf(stats.skipped, "blue")
      ]);
    });

    console.log("");
    console.log("");
    console.log(terminal.renderTables(table1, table2, table3));
    console.log("");

    if (runUrl) {
      console.log("");

      const table4 = terminal.table({
        colWidths: [100],
        type: "pageDivider",
        style: {
          "padding-left": 2
        }
      });

      table4.push(["", ""]);
      table4.push([`Recorded Run: ${gray(runUrl)}`]);

      console.log(terminal.renderTables(table4));
      return console.log("");
    }
  }
} ;

const iterateThroughSpecs = function(options = {}) {
  const { specs, runEachSpec, parallel, beforeSpecRun, afterSpecRun, config } = options;

  const serial = () => Promise.mapSeries(specs, runEachSpec);

  const serialWithRecord = () =>
    Promise
    .mapSeries(specs, (spec, index, length) =>
      beforeSpecRun(spec)
      .then(({ estimated }) => runEachSpec(spec, index, length, estimated)).tap(results => afterSpecRun(spec, results, config))
    )
  ;

  var parallelWithRecord = runs =>
    beforeSpecRun()
    .then(function({ spec, claimedInstances, totalInstances, estimated }) {
      //# no more specs to run?
      if (!spec) {
        //# then we're done!
        return runs;
      }

      //# find the actual spec object amongst
      //# our specs array since the API sends us
      //# the relative name
      spec = _.find(specs, { relative: spec });

      return runEachSpec(spec, claimedInstances - 1, totalInstances, estimated)
      .tap(function(results) {
        runs.push(results);

        return afterSpecRun(spec, results, config);}).then(() =>
        //# recurse
        parallelWithRecord(runs)
      );
    })
  ;

  switch (false) {
    case !parallel:
      //# if we are running in parallel
      //# then ask the server for the next spec
      return parallelWithRecord([]);
    case !beforeSpecRun:
      //# else iterate serialially and record
      //# the results of each spec
      return serialWithRecord();
    default:
      //# else iterate in serial
      return serial();
  }
};

const getProjectId = function(project, id) {
  if (id == null) { id = env.get("CYPRESS_PROJECT_ID"); }

  //# if we have an ID just use it
  if (id) {
    return Promise.resolve(id);
  }

  return project
  .getProjectId()
  .catch(() =>
    //# no id no problem
    null
  );
};

const reduceRuns = (runs, prop) =>
  _.reduce(runs, (memo, run) => memo += _.get(run, prop)
  , 0)
;

const getRun = (run, prop) => _.get(run, prop);

const writeOutput = (outputPath, results) =>
  Promise.try(function() {
    if (!outputPath) { return; }

    debug("saving output results as %s", outputPath);

    return fs.outputJsonAsync(outputPath, results);
  })
;

const openProjectCreate = (projectRoot, socketId, options) =>
  //# now open the project to boot the server
  //# putting our web client app in headless mode
  //# - NO  display server logs (via morgan)
  //# - YES display reporter results (via mocha reporter)
  openProject.create(projectRoot, options, {
    socketId,
    morgan:       false,
    report:       true,
    isTextTerminal: options.isTextTerminal,
    onError(err) {
      console.log("");
      if (err.details) {
        console.log(err.message);
        console.log("");
        console.log(chalk.yellow(err.details));
      } else {
        console.log(err.stack);
      }
      return openProject.emit("exitEarlyWithErr", err.message);
    }
  })
  .catch({portInUse: true}, err =>
    //# TODO: this needs to move to emit exitEarly
    //# so we record the failure in CI
    errors.throw("PORT_IN_USE_LONG", err.port)
  )
;

const createAndOpenProject = function(socketId, options) {
  const { projectRoot, projectId } = options;

  return Project
  .ensureExists(projectRoot)
  .then(() =>
    //# open this project without
    //# adding it to the global cache
    openProjectCreate(projectRoot, socketId, options)
    .call("getProject")).then(project =>
    Promise.props({
      project,
      config: project.getConfig(),
      projectId: getProjectId(project, projectId)
    })
  );
};

const removeOldProfiles = () =>
  browsers.removeOldProfiles()
  .catch(err =>
    //# dont make removing old browsers profiles break the build
    errors.warning("CANNOT_REMOVE_OLD_BROWSER_PROFILES", err.stack)
  )
;

const trashAssets = function(config = {}) {
  if (config.trashAssetsBeforeRuns !== true) {
    return Promise.resolve();
  }

  return Promise.join(
    trash.folder(config.videosFolder),
    trash.folder(config.screenshotsFolder)
  )
  .catch(err =>
    //# dont make trashing assets fail the build
    errors.warning("CANNOT_TRASH_ASSETS", err.stack)
  );
};

module.exports = {
  collectTestResults,

  getProjectId,

  writeOutput,

  openProjectCreate,

  createRecording(name) {
    const outputDir = path.dirname(name);

    return fs
    .ensureDirAsync(outputDir)
    .then(() =>
      videoCapture.start(name, {
        onError(err) {
          //# catch video recording failures and log them out
          //# but don't let this affect the run at all
          return errors.warning("VIDEO_RECORDING_FAILED", err.stack);
        }
      })
    );
  },

  getElectronProps(isHeaded, project, write) {
    const obj = {
      width:  1280,
      height: 720,
      show:   isHeaded,
      onCrashed() {
        const err = errors.get("RENDERER_CRASHED");
        errors.log(err);

        return project.emit("exitEarlyWithErr", err.message);
      },
      onNewWindow(e, url, frameName, disposition, options) {
        //# force new windows to automatically open with show: false
        //# this prevents window.open inside of javascript client code
        //# to cause a new BrowserWindow instance to open
        //# https://github.com/cypress-io/cypress/issues/123
        return options.show = false;
      }
    };

    if (write) {
      obj.recordFrameRate = 20;
      obj.onPaint = (event, dirty, image) => write(image.toJPEG(100));
    }

    return obj;
  },

  displayResults(obj = {}, estimated) {
    const results = collectTestResults(obj, estimated);

    const c = results.failures ? "red" : "green";

    console.log("");

    terminal.header("Results", {
      color: [c]
    });

    const table = terminal.table({
      type: "outsideBorder"
    });

    const data = _.chain([
      ["Tests:", results.tests],
      ["Passing:", results.passes],
      ["Failing:", results.failures],
      ["Pending:", results.pending],
      ["Skipped:", results.skipped],
      ["Screenshots:", results.screenshots],
      ["Video:", results.video],
      ["Duration:", results.duration],
      estimated ? ["Estimated:", results.estimated] : undefined,
      ["Spec Ran:", results.name]
    ])
    .compact()
    .map(function(arr) {
      const [key, val] = arr;

      return [color(key, "gray"), color(val, c)];})
    .value();

    table.push(...data);

    console.log("");
    console.log(table.toString());
    return console.log("");
  },

  displayScreenshots(screenshots = []) {
    console.log("");

    terminal.header("Screenshots", {color: ["yellow"]});

    console.log("");

    const format = function(s) {
      const dimensions = gray(`(${s.width}x${s.height})`);

      return `  - ${s.path} ${dimensions}`;
    };

    screenshots.forEach(screenshot => console.log(format(screenshot)));

    return console.log("");
  },

  postProcessRecording(end, name, cname, videoCompression, shouldUploadVideo) {
    debug("ending the video recording %o", { name, videoCompression, shouldUploadVideo });

    //# once this ended promises resolves
    //# then begin processing the file
    return end()
    .then(function() {
      //# dont process anything if videoCompress is off
      //# or we've been told not to upload the video
      if ((videoCompression === false) || (shouldUploadVideo === false)) { return; }

      console.log("");

      terminal.header("Video", {
        color: ["cyan"]
      });

      console.log("");

      console.log(
        gray("  - Started processing:  "),
        chalk.cyan(`Compressing to ${videoCompression} CRF`)
      );

      const started  = new Date;
      let progress = Date.now();
      const throttle = env.get("VIDEO_COMPRESSION_THROTTLE") || human("10 seconds");

      const onProgress = function(float) {
        switch (false) {
          case float !== 1:
            var finished = new Date - started;
            var dur = `(${humanTime.long(finished)})`;
            console.log(
              gray("  - Finished processing: "),
              chalk.cyan(name),
              gray(dur)
            );
            return console.log("");

          case (new Date - progress) <= throttle:
            //# bump up the progress so we dont
            //# continuously get notifications
            progress += throttle;
            var percentage = Math.ceil(float * 100) + "%";
            return console.log("  - Compression progress: ", chalk.cyan(percentage));
        }
      };

        // bar.tickTotal(float)

      return videoCapture.process(name, cname, videoCompression, onProgress);}).catch({recordingVideoFailed: true}, function(err) {
      //# dont do anything if this error occured because
      //# recording the video had already failed
      
    }).catch(err =>
      //# log that post processing was attempted
      //# but failed and dont let this change the run exit code
      errors.warning("VIDEO_POST_PROCESSING_FAILED", err.stack)
    );
  },

  launchBrowser(options = {}) {
    const { browser, spec, write, project, screenshots, projectRoot } = options;

    const browserOpts = (() => { switch (browser.name) {
      case "electron":
        return this.getElectronProps(browser.isHeaded, project, write);
      default:
        return {};
    } })();

    browserOpts.automationMiddleware = {
      onAfterResponse: (message, data, resp) => {
        if ((message === "take:screenshot") && resp) {
          screenshots.push(this.screenshotMetadata(data, resp));
        }

        return resp;
      }
    };

    browserOpts.projectRoot = projectRoot;

    return openProject.launch(browser, spec, browserOpts);
  },

  listenForProjectEnd(project, exit) {
    return new Promise(function(resolve) {
      if (exit === false) {
        resolve = arg => console.log("not exiting due to options.exit being false");
      }

      const onEarlyExit = function(errMsg) {
        //# probably should say we ended
        //# early too: (Ended Early: true)
        //# in the stats
        const obj = {
          error: errors.stripAnsi(errMsg),
          stats: {
            failures: 1,
            tests: 0,
            passes: 0,
            pending: 0,
            suites: 0,
            skipped: 0,
            wallClockDuration: 0,
            wallClockStartedAt: (new Date()).toJSON(),
            wallClockEndedAt: (new Date()).toJSON()
          }
        };

        return resolve(obj);
      };

      const onEnd = obj => resolve(obj);

      //# when our project fires its end event
      //# resolve the promise
      project.once("end", onEnd);
      return project.once("exitEarlyWithErr", onEarlyExit);
    });
  },

  waitForBrowserToConnect(options = {}) {
    let waitForBrowserToConnect;
    const { project, socketId, timeout } = options;

    let attempts = 0;

    return (waitForBrowserToConnect = () => {
      return Promise.join(
        this.waitForSocketConnection(project, socketId),
        this.launchBrowser(options)
      )
      .timeout(timeout != null ? timeout : 30000)
      .catch(Promise.TimeoutError, err => {
        attempts += 1;

        console.log("");

        //# always first close the open browsers
        //# before retrying or dieing
        return openProject.closeBrowser()
        .then(function() {
          switch (attempts) {
            //# try again up to 3 attempts
            case 1: case 2:
              var word = attempts === 1 ? "Retrying..." : "Retrying again...";
              errors.warning("TESTS_DID_NOT_START_RETRYING", word);

              return waitForBrowserToConnect();

            default:
              err = errors.get("TESTS_DID_NOT_START_FAILED");
              errors.log(err);

              return project.emit("exitEarlyWithErr", err.message);
          }
        });
      });
    })();
  },

  waitForSocketConnection(project, id) {
    debug("waiting for socket connection... %o", { id });

    return new Promise(function(resolve, reject) {
      var fn = function(socketId) {
        debug("got socket connection %o", { id: socketId });

        if (socketId === id) {
          //# remove the event listener if we've connected
          project.removeListener("socket:connected", fn);

          //# resolve the promise
          return resolve();
        }
      };

      //# when a socket connects verify this
      //# is the one that matches our id!
      return project.on("socket:connected", fn);
    });
  },

  waitForTestsToFinishRunning(options = {}) {
    const { project, screenshots, started, end, name, cname, videoCompression, videoUploadOnPasses, exit, spec, estimated } = options;

    return this.listenForProjectEnd(project, exit)
    .then(obj => {
      _.defaults(obj, {
        error: null,
        hooks: null,
        tests: null,
        video: null,
        screenshots: null,
        reporterStats: null
      });

      if (end) {
        obj.video = name;
      }

      if (screenshots) {
        obj.screenshots = screenshots;
      }

      obj.spec = spec;

      const finish = () => obj;

      this.displayResults(obj, estimated);

      if (screenshots && screenshots.length) {
        this.displayScreenshots(screenshots);
      }

      const { tests, stats } = obj;

      const failingTests = _.filter(tests, { state: "failed" });

      const hasFailingTests = _.get(stats, 'failures') > 0;

      //# if we have a video recording
      if (started && tests && tests.length) {
        //# always set the video timestamp on tests
        obj.tests = Reporter.setVideoTimestamp(started, tests);
      }

      //# we should upload the video if we upload on passes (by default)
      //# or if we have any failures and have started the video
      const suv = Boolean((videoUploadOnPasses === true) || (started && hasFailingTests));

      obj.shouldUploadVideo = suv;

      debug("attempting to close the browser");

      //# always close the browser now as opposed to letting
      //# it exit naturally with the parent process due to
      //# electron bug in windows
      return openProject.closeBrowser()
      .then(() => {
        if (end) {
          return this.postProcessRecording(end, name, cname, videoCompression, suv)
          .then(finish);
          //# TODO: add a catch here
        } else {
          return finish();
        }
      });
    });
  },

  screenshotMetadata(data, resp) {
    return {
      screenshotId: random.id(),
      name:      data.name != null ? data.name : null,
      testId:    data.testId,
      takenAt:   resp.takenAt,
      path:      resp.path,
      height:    resp.dimensions.height,
      width:     resp.dimensions.width
    };
  },

  runSpecs(options = {}) {
    const { config, browser, sys, headed, outputPath, specs, specPattern, beforeSpecRun, afterSpecRun, runUrl, parallel, group } = options;

    const isHeadless = (browser.name === "electron") && !headed;

    browser.isHeadless = isHeadless;
    browser.isHeaded = !isHeadless;

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
    };

    displayRunStarting({
      specs,
      group,
      runUrl,
      browser,
      parallel,
      specPattern
    });

    const runEachSpec = (spec, index, length, estimated) => {
      displaySpecHeader(spec.name, index + 1, length, estimated);

      return this.runSpec(spec, options, estimated)
      .get("results")
      .tap(results => debug("spec results %o", results));
    };

    return iterateThroughSpecs({
      specs,
      config,
      parallel,
      runEachSpec,
      afterSpecRun,
      beforeSpecRun
    })
    .then(function(runs = []) {
      let end, start;
      results.startedTestsAt = (start = getRun(_.first(runs), "stats.wallClockStartedAt"));
      results.endedTestsAt = (end = getRun(_.last(runs), "stats.wallClockEndedAt"));
      results.totalDuration = reduceRuns(runs, "stats.wallClockDuration");
      results.totalSuites = reduceRuns(runs, "stats.suites");
      results.totalTests = reduceRuns(runs, "stats.tests");
      results.totalPassed = reduceRuns(runs, "stats.passes");
      results.totalPending = reduceRuns(runs, "stats.pending");
      results.totalFailed = reduceRuns(runs, "stats.failures");
      results.totalSkipped = reduceRuns(runs, "stats.skipped");
      results.runs = runs;

      debug("final results of all runs: %o", results);

      return writeOutput(outputPath, results)
      .return(results);
    });
  },

  runSpec(spec = {}, options = {}, estimated) {
    let cname, name, recording;
    const { project, browser, video, videosFolder } = options;

    const { isHeadless, isHeaded } = browser;

    debug("about to run spec %o", {
      spec,
      isHeadless,
      browser
    });

    const screenshots = [];

    //# we know we're done running headlessly
    //# when the renderer has connected and
    //# finishes running all of the tests.
    //# we're using an event emitter interface
    //# to gracefully handle this in promise land

    //# if we've been told to record and we're not spawning a headed browser
    const browserCanBeRecorded = browser => (browser.name === "electron") && isHeadless;

    if (video) {
      if (browserCanBeRecorded(browser)) {
        if (!videosFolder) {
          throw new Error("Missing videoFolder for recording");
        }

        name  = path.join(videosFolder, spec.name + ".mp4");
        cname = path.join(videosFolder, spec.name + "-compressed.mp4");

        recording = this.createRecording(name);
      } else {
        console.log("");

        if ((browser.name === "electron") && isHeaded) {
          errors.warning("CANNOT_RECORD_VIDEO_HEADED");
        } else {
          errors.warning("CANNOT_RECORD_VIDEO_FOR_THIS_BROWSER", browser.name);
        }
      }
    }

    return Promise.resolve(recording)
    .then((props = {}) => {
      //# extract the started + ended promises from recording
      const {start, end, write} = props;

      //# make sure we start the recording first
      //# before doing anything
      return Promise.resolve(start)
      .then(started => {
        return Promise.props({
          results: this.waitForTestsToFinishRunning({
            end,
            name,
            spec,
            cname,
            started,
            project,
            estimated,
            screenshots,
            exit:                 options.exit,
            videoCompression:     options.videoCompression,
            videoUploadOnPasses:  options.videoUploadOnPasses
          }),

          connection: this.waitForBrowserToConnect({
            spec,
            write,
            project,
            browser,
            screenshots,
            socketId:    options.socketId,
            webSecurity: options.webSecurity,
            projectRoot: options.projectRoot
          })
        });
      });
    });
  },

  findSpecs(config, specPattern) {
    return specsUtil.find(config, specPattern)
    .tap((specs = []) => {
      if (debug.enabled) {
        const names = _.map(specs, "name");
        return debug(
          "found '%d' specs using spec pattern '%s': %o",
          names.length,
          specPattern,
          names
        );
      }
    });
  },

  ready(options = {}) {
    debug("run mode ready with options %o", options);

    _.defaults(options, {
      isTextTerminal: true,
      browser: "electron"
    });

    const socketId = random.id();

    const { projectRoot, record, key, ciBuildId, parallel, group } = options;

    const browserName = options.browser;

    //# alias and coerce to null
    let specPattern = options.spec != null ? options.spec : null;

    //# warn if we're using deprecated --ci flag
    recordMode.warnIfCiFlag(options.ci);

    //# ensure the project exists
    //# and open up the project
    return createAndOpenProject(socketId, options)
    .then(({ project, projectId, config }) => {
      //# if we have a project id and a key but record hasnt been given
      recordMode.warnIfProjectIdButNoRecordOption(projectId, options);
      recordMode.throwIfRecordParamsWithoutRecording(record, ciBuildId, parallel, group);

      if (record) {
        recordMode.throwIfNoProjectId(projectId);
        recordMode.throwIfIncorrectCiBuildIdUsage(ciBuildId, parallel, group);
        recordMode.throwIfIndeterminateCiBuildId(ciBuildId, parallel, group);
      }

      return Promise.all([
        system.info(),
        browsers.ensureAndGetByNameOrPath(browserName),
        this.findSpecs(config, specPattern),
        trashAssets(config),
        removeOldProfiles()
      ])
      .spread((sys = {}, browser = {}, specs = []) => {
        //# return only what is return to the specPattern
        if (specPattern) {
          specPattern = specsUtil.getPatternRelativeToProjectRoot(specPattern, projectRoot);
        }

        if (!specs.length) {
          errors.throw('NO_SPECS_FOUND', config.integrationFolder, specPattern);
        }

        const runAllSpecs = ({ beforeSpecRun, afterSpecRun, runUrl }, parallelOverride = parallel) => {
          return this.runSpecs({
            beforeSpecRun,
            afterSpecRun,
            projectRoot,
            specPattern,
            socketId,
            parallel: parallelOverride,
            browser,
            project,
            runUrl,
            group,
            config,
            specs,
            sys,
            videosFolder:         config.videosFolder,
            video:                config.video,
            videoCompression:     config.videoCompression,
            videoUploadOnPasses:  config.videoUploadOnPasses,
            exit:                 options.exit,
            headed:               options.headed,
            outputPath:           options.outputPath
          })
          .tap(renderSummaryTable(runUrl));
        };

        if (record) {
          const { projectName } = config;

          return recordMode.createRunAndRecordSpecs({
            key,
            sys,
            specs,
            group,
            browser,
            parallel,
            ciBuildId,
            projectId,
            projectRoot,
            projectName,
            specPattern,
            runAllSpecs
          });
        } else {
          //# not recording, can't be parallel
          return runAllSpecs({}, false);
        }
      });
    });
  },

  run(options) {
    return electronApp
    .ready()
    .then(() => {
      return this.ready(options);
    });
  }

};
