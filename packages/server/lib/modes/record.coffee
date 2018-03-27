_          = require("lodash")
os         = require("os")
chalk      = require("chalk")
Promise    = require("bluebird")
headless   = require("./headless")
api        = require("../api")
logger     = require("../logger")
errors     = require("../errors")
stdout     = require("../stdout")
upload     = require("../upload")
Project    = require("../project")
terminal   = require("../util/terminal")
ciProvider = require("../util/ci_provider")
debug      = require("debug")("cypress:server")
commitInfo = require("@cypress/commit-info")
la         = require("lazy-ass")
check      = require("check-more-types")
isForkPr   = require("is-fork-pr")

logException = (err) ->
  ## give us up to 1 second to
  ## create this exception report
  logger.createException(err)
  .timeout(1000)
  .catch ->
    ## dont yell about any errors either

module.exports = {
  generateProjectRunId: (projectId, projectPath, projectName, recordKey, group, groupId, specPattern) ->
    if not recordKey
      errors.throw("RECORD_KEY_MISSING")
    if groupId and not group
      console.log("Warning: you passed group-id but no group flag")

    la(check.maybe.unemptyString(specPattern), "invalid spec pattern", specPattern)

    debug("generating build id for project %s at %s", projectId, projectPath)
    Promise.all([
      commitInfo.commitInfo(projectPath),
      Project.findSpecs(projectPath, specPattern)
    ])
    .spread (git, specs) ->
      debug("git information")
      debug(git)
      if specPattern
        debug("spec pattern", specPattern)
      debug("project specs")
      debug(specs)
      la(check.maybe.strings(specs), "invalid list of specs to run", specs)
      # only send groupId if group option is true
      if group
        groupId ?= ciProvider.groupId()
      else
        groupId = null
      createRunOptions = {
        projectId:         projectId
        recordKey:         recordKey
        commitSha:         git.sha
        commitBranch:      git.branch
        commitAuthorName:  git.author
        commitAuthorEmail: git.email
        commitMessage:     git.message
        remoteOrigin:      git.remote
        ciParams:          ciProvider.params()
        ciProvider:        ciProvider.name()
        ciBuildNumber:     ciProvider.buildNum()
        groupId:           groupId
        specs:             specs
        specPattern:       specPattern
      }

      api.createRun(createRunOptions)
      .catch (err) ->
        switch err.statusCode
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

  createInstance: (runId, spec, browser) ->
    api.createInstance({
      runId
      spec
      browser
    })
    .catch (err) ->
      errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)

      ## dont log exceptions if we have a 503 status code
      if err.statusCode isnt 503
        logException(err)
        .return(null)
      else
        null

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
        screenshot = _.find(screenshots, {clientId: obj.clientId})

        send(screenshot.path, obj.uploadUrl)

    if not uploads.length
      console.log("  - Nothing to Upload")

    Promise
    .all(uploads)
    .catch (err) ->
      errors.warning("DASHBOARD_CANNOT_UPLOAD_RESULTS", err)

      logException(err)

  uploadAssets: (instanceId, results, stdout) ->
    console.log("")
    console.log("")

    terminal.header("Uploading Assets", {
      color: ["blue"]
    })

    console.log("")

    ## get rid of the path property
    screenshots = _.map results.screenshots, (screenshot) ->
      _.omit(screenshot, "path")

    api.updateInstance({
      instanceId:   instanceId
      tests:        _.get(results, "stats.tests")
      passes:       _.get(results, "stats.passes")
      failures:     _.get(results, "stats.failures")
      pending:      _.get(results, "stats.pending")
      duration:     _.get(results, "stats.duration")
      error:        results.error
      video:        !!results.video
      screenshots:  screenshots
      failingTests: results.failingTests
      cypressConfig: results.config
      ciProvider:    ciProvider.name() ## TODO: don't send this (no reason to)
      stdout:       stdout
    })
    .then (resp = {}) =>
      @upload({
        video:          results.video
        uploadVideo:    results.shouldUploadVideo
        screenshots:    results.screenshots
        videoUrl:       resp.videoUploadUrl
        screenshotUrls: resp.screenshotUploadUrls
      })
    .catch (err) ->
      errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)

      ## dont log exceptions if we have a 503 status code
      if err.statusCode isnt 503
        logException(err)
        .return(null)
      else
        null

  uploadStdout: (instanceId, stdout) ->
    api.updateInstanceStdout({
      instanceId:   instanceId
      stdout:       stdout
    })
    .catch (err) ->
      errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)

      ## dont log exceptions if we have a 503 status code
      logException(err) unless err.statusCode is 503

  run: (options) ->
    { projectPath, browser } = options

    ## default browser
    browser ?= "electron"

    captured = stdout.capture()

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

    Project.add(projectPath)
    .then ->
      Project.id(projectPath)
      .catch ->
        errors.throw("CANNOT_RECORD_NO_PROJECT_ID")
    .then (projectId) =>
      ## store the projectId for later use
      options.projectId = projectId

      Project.config(projectPath)
      .then (cfg) =>
        { projectName } = cfg

        key = options.key ? process.env.CYPRESS_RECORD_KEY or process.env.CYPRESS_CI_KEY

        if not key and isForkPr.isForkPr()
          errors.warning("RECORDING_FROM_FORK_PR")
          maybeGetRunId = Promise.resolve()
        else
          maybeGetRunId = @generateProjectRunId(projectId, projectPath, projectName, key,
            options.group, options.groupId, options.spec)

        maybeGetRunId
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

          headless.run(options)
          .then (results = {}) =>
            ## if we got a instanceId then attempt to
            ## upload these assets
            if instanceId
              @uploadAssets(instanceId, results, captured.toString())
              .then (ret) ->
                didUploadAssets = ret isnt null
              .return(results)
              .finally =>
                headless.allDone()

                if didUploadAssets
                  stdout.restore()
                  @uploadStdout(instanceId, captured.toString())

            else
              stdout.restore()
              headless.allDone()
              return results
}
