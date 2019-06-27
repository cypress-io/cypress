_          = require("lodash")
os         = require("os")
la         = require("lazy-ass")
chalk      = require("chalk")
check      = require("check-more-types")
debug      = require("debug")("cypress:server:record")
Promise    = require("bluebird")
isForkPr   = require("is-fork-pr")
commitInfo = require("@cypress/commit-info")
api        = require("../api")
logger     = require("../logger")
errors     = require("../errors")
capture    = require("../capture")
upload     = require("../upload")
env        = require("../util/env")
keys       = require("../util/keys")
terminal   = require("../util/terminal")
humanTime  = require("../util/human_time")
ciProvider = require("../util/ci_provider")

onBeforeRetry = (details) ->
  errors.warning(
    "DASHBOARD_API_RESPONSE_FAILED_RETRYING", {
      delay: humanTime.long(details.delay, false)
      tries: details.total - details.retryIndex
      response: details.err
    }
  )

logException = (err) ->
  ## give us up to 1 second to
  ## create this exception report
  logger.createException(err)
  .timeout(1000)
  .catch ->
    ## dont yell about any errors either

runningInternalTests = ->
  env.get("CYPRESS_INTERNAL_E2E_TESTS") is "1"

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

throwIfIndeterminateCiBuildId = (ciBuildId, parallel, group) ->
  if (not ciBuildId and not ciProvider.provider()) and (parallel or group)
    errors.throw(
      "INDETERMINATE_CI_BUILD_ID",
      {
        group,
        parallel
      },
      ciProvider.detectableCiBuildIdProviders()
    )

throwIfRecordParamsWithoutRecording = (record, ciBuildId, parallel, group) ->
  if not record and _.some([ciBuildId, parallel, group])
    errors.throw("RECORD_PARAMS_WITHOUT_RECORDING", {
      ciBuildId,
      group,
      parallel
    })

throwIfIncorrectCiBuildIdUsage = (ciBuildId, parallel, group) ->
  ## we've been given an explicit ciBuildId
  ## but no parallel or group flag
  if ciBuildId and (not parallel and not group)
    errors.throw("INCORRECT_CI_BUILD_ID_USAGE", { ciBuildId })

throwIfNoProjectId = (projectId) ->
  if not projectId
    errors.throw("CANNOT_RECORD_NO_PROJECT_ID")

getSpecRelativePath = (spec) ->
  _.get(spec, "relative", null)

uploadArtifacts = (options = {}) ->
  { video, screenshots, videoUploadUrl, shouldUploadVideo, screenshotUploadUrls } = options

  uploads = []
  count   = 0

  nums = ->
    count += 1

    chalk.gray("(#{count}/#{uploads.length})")

  send = (pathToFile, url) ->
    success = ->
      console.log("  - Done Uploading #{nums()}", chalk.blue(pathToFile))

    fail = (err) ->
      debug("failed to upload artifact %o", {
        file: pathToFile
        stack: err.stack
      })

      console.log("  - Failed Uploading #{nums()}", chalk.red(pathToFile))

    uploads.push(
      upload.send(pathToFile, url)
      .then(success)
      .catch(fail)
    )

  if videoUploadUrl and shouldUploadVideo
    send(video, videoUploadUrl)

  if screenshotUploadUrls
    screenshotUploadUrls.forEach (obj) ->
      screenshot = _.find(screenshots, { screenshotId: obj.screenshotId })

      send(screenshot.path, obj.uploadUrl)

  if not uploads.length
    console.log("  - Nothing to Upload")

  Promise
  .all(uploads)
  .catch (err) ->
    errors.warning("DASHBOARD_CANNOT_UPLOAD_RESULTS", err)

    logException(err)

updateInstanceStdout = (options = {}) ->
  { instanceId, captured } = options

  stdout = captured.toString()

  makeRequest = ->
    api.updateInstanceStdout({
      stdout
      instanceId
    })

  api.retryWithBackoff(makeRequest, { onBeforeRetry })
  .catch (err) ->
    debug("failed updating instance stdout %o", {
      stack: err.stack
    })

    errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)

    ## dont log exceptions if we have a 503 status code
    logException(err) unless err.statusCode is 503
  .finally(capture.restore)

updateInstance = (options = {}) ->
  { instanceId, results, captured, group, parallel, ciBuildId } = options
  { stats, tests, hooks, video, screenshots, reporterStats, error } = results

  video = Boolean(video)
  cypressConfig = options.config
  stdout = captured.toString()

  ## get rid of the path property
  screenshots = _.map screenshots, (screenshot) ->
    _.omit(screenshot, "path")

  makeRequest = ->
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

  api.retryWithBackoff(makeRequest, { onBeforeRetry })
  .catch (err) ->
    debug("failed updating instance %o", {
      stack: err.stack
    })

    if parallel
      return errors.throw("DASHBOARD_CANNOT_PROCEED_IN_PARALLEL", {
        response: err,
        flags: {
          group,
          ciBuildId,
        },
      })

    errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)

    ## dont log exceptions if we have a 503 status code
    if err.statusCode isnt 503
      logException(err)
      .return(null)
    else
      null

getCommitFromGitOrCi = (git) ->
  la(check.object(git), 'expected git information object', git)
  ciProvider.commitDefaults({
    sha: git.sha
    branch: git.branch
    authorName: git.author
    authorEmail: git.email
    message: git.message
    remoteOrigin: git.remote
    defaultBranch: null
  })

usedTestsMessage = (limit, phrase) ->
  if _.isFinite(limit)
    "The limit is #{chalk.blue(limit)} #{phrase} recordings."
  else
    ""

billingLink = (orgId) ->
  if orgId
    "https://on.cypress.io/dashboard/organizations/#{orgId}/billing"
  else
    "https://on.cypress.io/set-up-billing"

gracePeriodMessage = (gracePeriodEnds) ->
  gracePeriodEnds or "the grace period ends"

createRun = (options = {}) ->
  _.defaults(options, {
    group: null,
    parallel: null,
    ciBuildId: null,
  })

  { projectId, recordKey, platform, git, specPattern, specs, parallel, ciBuildId, group } = options

  recordKey ?= env.get("CYPRESS_RECORD_KEY") or env.get("CYPRESS_CI_KEY")

  if not recordKey
    ## are we a forked pull request (forked PR) and are we NOT running our own internal
    ## e2e tests? currently some e2e tests fail when a user submits
    ## a PR because this logic triggers unintended here
    if isForkPr.isForkPr() and not runningInternalTests()
      ## bail with a warning
      return errors.warning("RECORDING_FROM_FORK_PR")

    ## else throw
    errors.throw("RECORD_KEY_MISSING")

  ## go back to being a string
  if specPattern
    specPattern = specPattern.join(",")

  if ciBuildId
    ## stringify
    ciBuildId = String(ciBuildId)

  specs = _.map(specs, getSpecRelativePath)

  commit = getCommitFromGitOrCi(git)
  debug("commit information from Git or from environment variables")
  debug(commit)

  makeRequest = ->
    api.createRun({
      specs
      group
      parallel
      platform
      ciBuildId
      projectId
      recordKey
      specPattern
      ci: {
        params: ciProvider.ciParams()
        provider: ciProvider.provider()
      }
      commit
    })

  api.retryWithBackoff(makeRequest, { onBeforeRetry })
  .tap (response) ->
    return if not response?.warnings?.length

    _.each response.warnings, (warning) ->
      switch warning.code
        when "FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS"
          errors.warning("FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS", {
            usedTestsMessage: usedTestsMessage(warning.limit, "private test")
            gracePeriodMessage: gracePeriodMessage(warning.gracePeriodEnds)
            link: billingLink(warning.orgId)
          })
        when "FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS"
          errors.warning("FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS", {
            usedTestsMessage: usedTestsMessage(warning.limit, "test")
            gracePeriodMessage: gracePeriodMessage(warning.gracePeriodEnds)
            link: billingLink(warning.orgId)
          })
        when "FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE"
          errors.warning("FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE", {
            gracePeriodMessage: gracePeriodMessage(warning.gracePeriodEnds)
            link: billingLink(warning.orgId)
          })
        when "PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS"
          errors.warning("PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS", {
            usedTestsMessage: usedTestsMessage(warning.limit, "private test")
            link: billingLink(warning.orgId)
          })
        when "PAID_PLAN_EXCEEDS_MONTHLY_TESTS"
          errors.warning("PAID_PLAN_EXCEEDS_MONTHLY_TESTS", {
            usedTestsMessage: usedTestsMessage(warning.limit, "test")
            link: billingLink(warning.orgId)
          })
        when "PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED"
          errors.warning("PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED", {
            gracePeriodMessage: gracePeriodMessage(warning.gracePeriodEnds)
            link: billingLink(warning.orgId)
          })
        else
          errors.warning("DASHBOARD_UNKNOWN_CREATE_RUN_WARNING", {
            message: warning.message,
            props: _.omit(warning, 'message')
          })

  .catch (err) ->
    debug("failed creating run %o", {
      stack: err.stack
    })

    switch err.statusCode
      when 401
        recordKey = keys.hide(recordKey)
        errors.throw("DASHBOARD_RECORD_KEY_NOT_VALID", recordKey, projectId)
      when 402
        { code, payload } = err.error

        limit = _.get(payload, "limit")
        orgId = _.get(payload, "orgId")

        switch code
          when "FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS"
            errors.throw("FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS", {
              usedTestsMessage: usedTestsMessage(limit, "private test")
              link: billingLink(orgId)
            })
          when "FREE_PLAN_EXCEEDS_MONTHLY_TESTS"
            errors.throw("FREE_PLAN_EXCEEDS_MONTHLY_TESTS", {
              usedTestsMessage: usedTestsMessage(limit, "test")
              link: billingLink(orgId)
            })
          when "PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN"
            errors.throw("PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN", {
              link: billingLink(orgId)
            })
          when "RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN"
            errors.throw("RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN", {
              link: billingLink(orgId)
            })
          else
            errors.throw("DASHBOARD_UNKNOWN_INVALID_REQUEST", {
              response: err,
              flags: {
                group,
                parallel,
                ciBuildId,
              },
            })
      when 404
        errors.throw("DASHBOARD_PROJECT_NOT_FOUND", projectId)
      when 412
        errors.throw("DASHBOARD_INVALID_RUN_REQUEST", err.error)
      when 422
        { code, payload } = err.error

        runUrl = _.get(payload, "runUrl")

        switch code
          when "RUN_GROUP_NAME_NOT_UNIQUE"
            errors.throw("DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE", {
              group,
              runUrl,
              ciBuildId,
            })
          when "PARALLEL_GROUP_PARAMS_MISMATCH"
            { browserName, browserVersion, osName, osVersion } = platform

            errors.throw("DASHBOARD_PARALLEL_GROUP_PARAMS_MISMATCH", {
              group,
              runUrl,
              ciBuildId,
              parameters: {
                osName,
                osVersion,
                browserName,
                browserVersion,
                specs,
              }
            })
          when "PARALLEL_DISALLOWED"
            errors.throw("DASHBOARD_PARALLEL_DISALLOWED", {
              group,
              runUrl,
              ciBuildId,
            })
          when "PARALLEL_REQUIRED"
            errors.throw("DASHBOARD_PARALLEL_REQUIRED", {
              group,
              runUrl,
              ciBuildId,
            })
          when "ALREADY_COMPLETE"
            errors.throw("DASHBOARD_ALREADY_COMPLETE", {
              runUrl,
              group,
              parallel,
              ciBuildId,
            })
          when "STALE_RUN"
            errors.throw("DASHBOARD_STALE_RUN", {
              runUrl,
              group,
              parallel,
              ciBuildId,
            })
          else
            errors.throw("DASHBOARD_UNKNOWN_INVALID_REQUEST", {
              response: err,
              flags: {
                group,
                parallel,
                ciBuildId,
              },
            })
      else
        if parallel
          return errors.throw("DASHBOARD_CANNOT_PROCEED_IN_PARALLEL", {
            response: err,
            flags: {
              group,
              ciBuildId,
            },
          })

        ## warn the user that assets will be not recorded
        errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)

        ## report on this exception
        ## and return null
        logException(err)
        .return(null)

createInstance = (options = {}) ->
  { runId, group, groupId, parallel, machineId, ciBuildId, platform, spec } = options

  spec = getSpecRelativePath(spec)

  makeRequest = ->
    api.createInstance({
      spec
      runId
      groupId
      platform
      machineId
    })

  api.retryWithBackoff(makeRequest, { onBeforeRetry })
  .catch (err) ->
    debug("failed creating instance %o", {
      stack: err.stack
    })

    if parallel
      return errors.throw("DASHBOARD_CANNOT_PROCEED_IN_PARALLEL", {
        response: err,
        flags: {
          group,
          ciBuildId,
        },
      })

    errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)

    ## dont log exceptions if we have a 503 status code
    if err.statusCode isnt 503
      logException(err)
      .return(null)
    else
      null

createRunAndRecordSpecs = (options = {}) ->
  { specPattern, specs, sys, browser, projectId, projectRoot, runAllSpecs, parallel, ciBuildId, group } = options

  recordKey = options.key

  commitInfo.commitInfo(projectRoot)
  .then (git) ->
    debug("found the following git information")
    debug(git)

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
      group
      parallel
      platform
      recordKey
      ciBuildId
      projectId
      specPattern
    })
    .then (resp) ->
      if not resp
        ## if a forked run, can't record and can't be parallel
        ## because the necessary env variables aren't present
        runAllSpecs({}, false)
      else
        { runUrl, runId, machineId, groupId } = resp

        captured = null
        instanceId = null

        beforeSpecRun = (spec) ->
          debug("before spec run %o", { spec })

          capture.restore()

          captured = capture.stdout()

          createInstance({
            spec
            runId
            group
            groupId
            platform
            parallel
            ciBuildId
            machineId
          })
          .then (resp = {}) ->
            { instanceId } = resp

            ## pull off only what we need
            return _
            .chain(resp)
            .pick("spec", "claimedInstances", "totalInstances")
            .extend({
              estimated: resp.estimatedWallClockDuration
            })
            .value()

        afterSpecRun = (spec, results, config) ->
          ## dont do anything if we failed to
          ## create the instance
          return if not instanceId

          debug("after spec run %o", { spec })

          console.log("")

          terminal.header("Uploading Results", {
            color: ["blue"]
          })

          console.log("")

          updateInstance({
            group
            config
            results
            captured
            parallel
            ciBuildId
            instanceId
          })
          .then (resp) ->
            return if not resp

            { video, shouldUploadVideo, screenshots } = results
            { videoUploadUrl, screenshotUploadUrls } = resp

            uploadArtifacts({
              video
              screenshots
              videoUploadUrl
              shouldUploadVideo
              screenshotUploadUrls
            })
            .finally ->
              ## always attempt to upload stdout
              ## even if uploading failed
              updateInstanceStdout({
                captured
                instanceId
              })

        runAllSpecs({ beforeSpecRun, afterSpecRun, runUrl })

module.exports = {
  createRun

  createInstance

  updateInstance

  updateInstanceStdout

  uploadArtifacts

  warnIfCiFlag

  throwIfNoProjectId

  throwIfIndeterminateCiBuildId

  throwIfIncorrectCiBuildIdUsage

  warnIfProjectIdButNoRecordOption

  throwIfRecordParamsWithoutRecording

  createRunAndRecordSpecs

  getCommitFromGitOrCi
}
