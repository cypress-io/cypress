_          = require("lodash")
os         = require("os")
chalk      = require("chalk")
Promise    = require("bluebird")
api        = require("../api")
logger     = require("../logger")
errors     = require("../errors")
capture    = require("../capture")
upload     = require("../upload")
# Project    = require("../project")
browsers   = require('../browsers')
env        = require("../util/env")
system     = require("../util/system")
terminal   = require("../util/terminal")
ciProvider = require("../util/ci_provider")
debug      = require("debug")("cypress:server")
commitInfo = require("@cypress/commit-info")
la         = require("lazy-ass")
check      = require("check-more-types")

logException = (err) ->
  ## give us up to 1 second to
  ## create this exception report
  logger.createException(err)
  .timeout(1000)
  .catch ->
    ## dont yell about any errors either

warnIfCiFlag = (ci) ->
  ## if we are using the ci flag that means
  ## we have an old version of the CLI tools installed
  ## and that we need to warn the user what to update
  if ci
    type = switch
      when env.get("CYPRESS_CI_KEY")
        "CYPRESS_CI_DEPRECATED_ENV_VAR"
      else
        "CYPRESS_CI_DEPRECATED"

    errors.warning(type)

haveProjectIdAndKeyButNoRecordOption = (projectId, options) ->
  ## if we have a project id
  ## and we have a key
  ## and (record or ci) hasn't been set to true or false
  (projectId and options.key) and (
    _.isUndefined(options.record) and _.isUndefined(options.ci)
  )

warnIfProjectIdButNoRecordOption = (projectId, options) ->
  if haveProjectIdAndKeyButNoRecordOption(projectId, options)
    ## log a warning telling the user
    ## that they either need to provide us
    ## with a RECORD_KEY or turn off
    ## record mode
    errors.warning("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION", projectId)

throwIfNoProjectId = (projectId) ->
  if not projectId
    errors.throw("CANNOT_RECORD_NO_PROJECT_ID")

getSpecPath = (spec) ->
  _.get(spec, "path")

updateInstanceStdout = (options = {}) ->
  { instanceId, captured } = options

  stdout = captured.toString()

  api.updateInstanceStdout({
    stdout
    instanceId
  })
  .catch (err) ->
    errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)

    ## dont log exceptions if we have a 503 status code
    logException(err) unless err.statusCode is 503
  .finally(capture.restore)

updateInstance = (options = {}) ->
  { instanceId, results, captured } = options

  { stats, tests, hooks, video, screenshots, reporterStats, error } = results

  video = Boolean(video)
  cypressConfig = results.config
  stdout = captured.toString()

  ## get rid of the path property
  screenshots = _.map screenshots, (screenshot) ->
    _.omit(screenshot, "path")

  api.updateInstance({
    stats
    tests
    error
    video
    hooks
    stdout
    instanceId
    screenshots
    reporterStats
    cypressConfig
  })
  # .then (resp = {}) =>
    ## TODO: WIP implement this
    # @upload({
    #   video:          results.video
    #   uploadVideo:    results.shouldUploadVideo
    #   screenshots:    results.screenshots
    #   videoUrl:       resp.videoUploadUrl
    #   screenshotUrls: resp.screenshotUploadUrls
    # })
  .catch (err) ->
    errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)

    ## dont log exceptions if we have a 503 status code
    if err.statusCode isnt 503
      logException(err)
      .return(null)
    else
      null

createRun = (options = {}) ->
  { projectId, recordKey, platform, git, specPattern, specs } = options

  recordKey ?= env.get("CYPRESS_RECORD_KEY") or env.get("CYPRESS_CI_KEY")

  if not recordKey
    errors.throw("RECORD_KEY_MISSING")

  ## go back to being a string
  if specPattern
    specPattern = specPattern.join(",")

  specs = _.map(specs, getSpecPath)

  api.createRun({
    specPattern
    specs
    projectId
    recordKey
    platform
    ci: {
      params: ciProvider.params()
      provider: ciProvider.name()
      buildNumber: ciProvider.buildNum()
    }
    commit: {
      sha: git.sha
      branch: git.branch
      authorName: git.author
      authorEmail: git.email
      message: git.message
      remoteOrigin: git.remote
    }
  })
  .catch (err) ->
    switch err.statusCode
      when 400
        errors.throw("DASHBOARD_INVALID_RUN_REQUEST", err.error)
      when 401
        recordKey = recordKey.slice(0, 5) + "..." + recordKey.slice(-5)
        errors.throw("RECORD_KEY_NOT_VALID", recordKey, projectId)
      when 404
        errors.throw("DASHBOARD_PROJECT_NOT_FOUND", projectId)
      else
        ## warn the user that assets will be not recorded
        errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)

        ## report on this exception
        ## and return null
        logException(err)
        .return(null)

createInstance = (options = {}) ->
  { runId, planId, machineId, platform, spec } = options

  spec = getSpecPath(spec)

  api.createInstance({
    spec
    runId
    planId
    platform
    machineId
  })
  .catch (err) ->
    errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)

    ## dont log exceptions if we have a 503 status code
    if err.statusCode isnt 503
      logException(err)
      .return(null)
    else
      null

createRunAndRecordSpecs = (options = {}) ->
  { specPattern, specs, browser, projectId, projectRoot, runAllSpecs } = options

  recordKey = options.key

  Promise.all([
    system.info()
    commitInfo.commitInfo(projectRoot)
    browsers.getByName(browser)
  ])
  .spread (sys, git, browser) ->
    platform = {
      osCpus: sys.osCpus
      osName: sys.osName
      osMemory: sys.osMemory
      osVersion: sys.osVersion
      browserName: browser.displayName
      browserVersion: browser.version
    }

    createRun({
      git
      specs
      platform
      recordKey
      projectId
      specPattern
    })
    .then (resp) ->
      if not resp
        runAllSpecs()
      else
        { runId, machineId, planId } = resp

        captured = null
        instanceId = null

        beforeSpecRun = (spec) ->
          capture.restore()

          captured = capture.stdout()

          createInstance({
            spec
            runId
            planId
            platform
            machineId
          })
          .then (id) ->
            instanceId = id

        afterSpecRun = (results) ->
          ## dont do anything if we failed to
          ## create the instance
          return if not instanceId

          console.log("")
          console.log("")

          terminal.header("Uploading Assets", {
            color: ["blue"]
          })

          console.log("")

          updateInstance({
            results
            captured
            instanceId
          })
          .then (ret) ->
            return if not ret

            updateInstanceStdout({
              captured
              instanceId
            })

        runAllSpecs(beforeSpecRun, afterSpecRun)

module.exports = {
  createRun

  createInstance

  updateInstance

  updateInstanceStdout

  warnIfCiFlag

  throwIfNoProjectId

  warnIfProjectIdButNoRecordOption

  createRunAndRecordSpecs

  upload: (options = {}) ->
    {video, uploadVideo, screenshots, videoUrl, screenshotUrls} = options

    uploads = []
    count   = 0

    nums = ->
      count += 1

      chalk.gray("(#{count}/#{uploads.length})")

    send = (pathToFile, url) ->
      success = ->
        console.log("  - Done Uploading #{nums()}", chalk.blue(pathToFile))

      fail = (err) ->
        console.log("  - Failed Uploading #{nums()}", chalk.red(pathToFile))

      uploads.push(
        upload.send(pathToFile, url)
        .then(success)
        .catch(fail)
      )

    if videoUrl and uploadVideo
      send(video, videoUrl)

    if screenshotUrls
      screenshotUrls.forEach (obj) ->
        screenshot = _.find(screenshots, { screenshotId: obj.screenshotId })

        send(screenshot.path, obj.uploadUrl)

    if not uploads.length
      console.log("  - Nothing to Upload")

    Promise
    .all(uploads)
    .catch (err) ->
      errors.warning("DASHBOARD_CANNOT_UPLOAD_RESULTS", err)

      logException(err)

  run: (options) ->
    { projectRoot, browser } = options

    ## default browser
    browser ?= "electron"

    captured = capture.stdout()

    ## if we are using the ci flag that means
    ## we have an old version of the CLI tools installed
    ## and that we need to warn the user what to update
    if options.ci
      type = switch
        when process.env.CYPRESS_CI_KEY
          "CYPRESS_CI_DEPRECATED_ENV_VAR"
        else
          "CYPRESS_CI_DEPRECATED"

      errors.warning(type)

    Project.add(projectRoot)
    .then ->
      Project.id(projectRoot)
      .catch ->
        errors.throw("CANNOT_RECORD_NO_PROJECT_ID")
    .then (projectId) =>
      ## store the projectId for later use
      options.projectId = projectId

      Project.config(projectRoot)
      .then (cfg) =>
        { projectName } = cfg

        key = options.key ? process.env.CYPRESS_RECORD_KEY or process.env.CYPRESS_CI_KEY

        @generateProjectRunId(projectId, projectRoot, projectName, key,
          options.group, options.groupId, options.spec)
        .then (runId) =>
          ## bail if we dont have a runId
          return if not runId

          @createInstance(runId, options.spec, browser)
        .then (instanceId) =>
          ## dont check that the user is logged in
          options.ensureAuthToken = false

          ## dont let headless say its all done
          options.allDone       = false

          didUploadAssets       = false

          runMode.run(options)
          .then (results = {}) =>
            ## if we got a instanceId then attempt to
            ## upload these assets
            if instanceId
              @uploadAssets(instanceId, results, captured.toString())
              .then (ret) ->
                didUploadAssets = ret isnt null
              .return(results)
              .finally =>
                runMode.allDone()

                if didUploadAssets
                  capture.restore()
                  @uploadStdout(instanceId, captured.toString())

            else
              capture.restore()
              runMode.allDone()
              return results
}
