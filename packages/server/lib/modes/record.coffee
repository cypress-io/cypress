_          = require("lodash")
R          = require("ramda")
os         = require("os")
path       = require("path")
chalk      = require("chalk")
Promise    = require("bluebird")
pluralize  = require("pluralize")
headless   = require("./headless")
api        = require("../api")
logger     = require("../logger")
errors     = require("../errors")
stdout     = require("../stdout")
upload     = require("../upload")
Project    = require("../project")
Stats      = require("../stats")
terminal   = require("../util/terminal")
ciProvider = require("../util/ci_provider")
debug      = require("debug")("cypress:server:record")
commitInfo = require("@cypress/commit-info")
la         = require("lazy-ass")
check      = require("check-more-types")
listToFunction = require("list-to-function")

logException = (err) ->
  ## give us up to 1 second to
  ## create this exception report
  logger.createException(err)
  .timeout(1000)
  .catch ->
    ## dont yell about any errors either

isInstanceInfo = (x) ->
  _.isPlainObject(x) &&
  check.maybe.unemptyString(x.instanceId) &&
  check.maybe.unemptyString(x.machineId)

warn = (message) ->
  la(check.unemptyString(message), "missing warning message", message)
  console.log("Warning:", message)

getProjectId = (projectPath) ->
  la(check.unemptyString(projectPath), "missing project path", projectPath)
  Project.id(projectPath)
  .catch ->
    errors.throw("CANNOT_RECORD_NO_PROJECT_ID")

checkFoundSpecs = (specPattern, specs) ->
  la(check.maybe.string(specPattern), "invalid spec pattern", specPattern)
  la(check.strings(specs), "could not discover list of specs", specs)

  if check.empty(specs)
    console.log("⚠️  cannot find any specs")
    if specPattern
      console.log("matching spec pattern", specPattern)
    # should we exit with error?
  else
    debug("found %s for pattern %s", pluralize("spec", specs.length, true), specPattern)
    debug(specs)

getRecordKey = (options) ->
  options.key or process.env.CYPRESS_RECORD_KEY or process.env.CYPRESS_CI_KEY

grabNextSpecFromApi = (buildId, parallelId) ->
  debug("asking to lock next spec for build %s", buildId)
  la(check.unemptyString(buildId), "missing buildId")
  la(check.unemptyString(parallelId), "missing parallelId")

  api.grabNextSpecForBuild({buildId, parallelId})
  .catch (err) ->
    errors.warning("DASHBOARD_CANNOT_GRAB_NEXT_SPEC", err)

    ## dont log exceptions if we have a 503 status code
    if err.statusCode isnt 503
      logException(err)
      .return(null)
    else
      null

getNextSpecFn = ({buildId, parallel, parallelId, specs}) ->
  if parallel and parallelId and buildId
    # ask API for next spec to run
    getNextSpec = () =>
      debug("asking API for next spec for build %s", buildId)
      grabNextSpecFromApi(buildId, parallelId)
  else
    # iterate over specs ourselves using async function
    getNextItem = listToFunction(specs)

    getNextSpec = () ->
      Promise.resolve(getNextItem())

  getNextSpec

# Collects options for headless runner to run single spec
getHeadlessRunOptions = (options, integrationFolder, specName) ->
  la(check.unemptyString(specName), "missing spec name")

  opts = {
    ## dont check that the user is logged in
    ensureAuthToken: false

    ## dont let headless say its all done
    allDone: false

    ## use relative name for reporting
    spec: path.join(integrationFolder, specName)
  }

  _.merge({}, options, opts)

module.exports = {
  generateProjectBuildId: (options) ->
    {
      projectId, projectPath, projectName,
      recordKey,
      group, groupId,
      specPattern, specs,
      parallel, parallelId
    } = options

    if not recordKey
      errors.throw("RECORD_KEY_MISSING")
    if groupId and not group
      warn("you passed group-id but no group flag")
    if parallelId and not parallel
      warn("you passed parallel-id but no parallel flag")

    la(check.maybe.unemptyString(specPattern), "invalid spec pattern", specPattern)

    debug("generating build id for project %s at %s", projectId, projectPath)
    commitInfo.commitInfo(projectPath)
    .then (git) ->
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
        debug("ci provider group id", groupId)
        if not groupId
          warn("could not generate group id for this CI provider")
      else
        groupId = null

      createRunOptions = {
        projectId
        recordKey
        commitSha:         git.sha
        commitBranch:      git.branch
        commitAuthorName:  git.author
        commitAuthorEmail: git.email
        commitMessage:     git.message
        remoteOrigin:      git.remote
        ciParams:          ciProvider.params()
        ciProvider:        ciProvider.name()
        ciBuildNumber:     ciProvider.buildNum()
        groupId
        specs
        specPattern
        parallelId
      }
      # TODO do not leave console.logs ⚠️
      # console.log('createRunOptions')
      # console.log(createRunOptions)

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

  createInstance: (buildId, spec, machineId, browser) ->
    debug("creating instance for build %s", buildId)
    if spec
      debug("for specific spec", spec)
    if machineId
      debug("with existing machine id", machineId)

    options = {
      buildId
      spec
      machineId
      browser
    }
    api.createInstance(options)
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

  uploadAssets: (instanceId, stats, stdout) ->
    console.log("")
    console.log("")

    terminal.header("Uploading Assets", {
      color: ["blue"]
    })

    console.log("")

    ## get rid of the path property
    screenshots = _.map stats.screenshots, (screenshot) ->
      _.omit(screenshot, "path")

    options = {
      instanceId:   instanceId
      tests:        stats.tests
      passes:       stats.passes
      failures:     stats.failures
      pending:      stats.pending
      duration:     stats.duration
      error:        stats.error
      video:        !!stats.video
      screenshots:  screenshots
      failingTests: stats.failingTests
      cypressConfig: stats.config
      ciProvider:    ciProvider.name() ## TODO: don't send this (no reason to)
      stdout:       stdout
    }
    api.updateInstance(options)
    .then (resp = {}) =>
      @upload({
        video:          stats.video
        uploadVideo:    stats.shouldUploadVideo
        screenshots:    stats.screenshots
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

  restoreOutputAfterTests: ->
    headless.allDone()
    stdout.restore()

  uploadArtifacts: (instanceId, stats, captured) ->
    debug("uploading asserts for instance", instanceId)

    didUploadAssets = false

    @uploadAssets(instanceId, stats, captured.toString())
    .then (ret) ->
      didUploadAssets = ret isnt null
    .return(stats)
    .finally =>
      if didUploadAssets
        debug("uploading stdout for instance", instanceId)
        @uploadStdout(instanceId, captured.toString())

  # when test run finished and we get test stats
  # we need to upload test results and clean up
  afterTestRun: (instanceId, captured) -> (stats = {}) =>
    debug("finished headless run with %d failed %s",
      stats.failures, pluralize("test", stats.failures, true))

    Promise.resolve()
    .then () =>
      ## if we got a instanceId then attempt to
      ## upload these assets
      if instanceId
        @uploadArtifacts(instanceId, stats, captured)
    .finally @restoreOutputAfterTests
    .return(stats)

  run: (options) ->
    { projectPath, browser } = options

    ## default browser
    browser ?= "electron"

    ## TODO split captured output per spec!
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

    # determine parallel settings right away so we
    # can use them in our logic
    if options.parallel
      options.parallelId ?= ciProvider.parallelId()
      debug("ci provider parallel id", options.parallelId)
      if not options.parallelId
        warn("could not generate parallel id for this CI provider")
    else
      options.parallelId = null

    # isParallelRun = options.parallel and options.parallelId

    Promise.resolve()
    .then () ->
      Project.add(projectPath)
    .then () ->
      getProjectId(projectPath)
    .then (projectId) =>
      ## store the projectId for later use
      debug("project id %s", projectId)
      options.projectId = projectId

      Project.config(projectPath)
      .then (cfg = {}) =>
        { projectName, integrationFolder } = cfg
        la(check.unemptyString(projectName),
          "missing project name in project config", cfg)
        la(check.unemptyString(integrationFolder),
          "missing integration folder in project config", cfg)

        specPattern = options.spec
        Project.findSpecs(cfg, specPattern)
        .then (specs) =>
          checkFoundSpecs(specPattern, specs)

          key = getRecordKey(options)

          # TODO combine inidividual stats if we need to
          specStats = []

          combineStats = ->
            Stats.combine(specStats.map(R.prop("stats")))

          projectBuildOptions = {
            projectId,
            projectPath,
            projectName,
            recordKey: key,
            group: options.group,
            groupId: options.groupId,
            specPattern,
            specs,
            parallel: options.parallel,
            parallelId: options.parallelId
          }
          @generateProjectBuildId(projectBuildOptions)
          .then (buildId) =>
            if buildId
              debug("build id %s", buildId)
            else
              debug("did not generate build id for project")

            # the common machineId will be initialized by the
            # first created instance
            commonMachineId = null

            getNextSpec = getNextSpecFn({
              parallel: options.parallel,
              parallelId: options.parallelId,
              buildId,
              specs
            })
            la(check.fn(getNextSpec), "could not decide how to get next spec")

            startNextSpecIfNeeded = ->
              getNextSpec()
              .then (nextSpec) ->
                if nextSpec
                  testNextSpec(nextSpec)
                else
                  debug("nothing left to test")

            # specName wrt project integration folder
            testNextSpec = (specName) =>
              la(check.unemptyString(specName), "missing spec name to test", specName)
              debug("starting testing spec: %s", specName)

              saveSpecStats = (stats) ->
                specStats.push({
                  spec: specName,
                  stats
                })

              newInstance = () =>
                ## bail if we dont have a buildId
                if not buildId
                  debug("we don't have a build ID")
                  Promise.resolve({})
                else
                  @createInstance(buildId, specName, commonMachineId, browser)

              runSpecForInstance = (instance = {}) =>
                la(isInstanceInfo(instance), "invalid new instance info", instance)

                {instanceId, machineId} = instance
                debug("new instance id %s machine id %s", instanceId, machineId)

                if not commonMachineId and machineId
                  commonMachineId = machineId
                  debug("remembering common machine %s id for instance", machineId)

                headlessRunOptions = getHeadlessRunOptions(options, integrationFolder, specName)

                # makes sure we have Bluebird promise all the way
                Promise.resolve()
                .then () ->
                  headless.run(headlessRunOptions)
                .catch (e) ->
                  # cannot find Bluebird's tapCatch is not a function
                  # so have to use regular catch and throw
                  debug("headless run error")
                  debug(e)
                  throw e
                .then @afterTestRun(instanceId, captured)

              newInstance()
              .then runSpecForInstance
              .then saveSpecStats
              .then startNextSpecIfNeeded

            # kick off testing specs
            startNextSpecIfNeeded()

          .then combineStats
          .tap (stats) ->
            debug('combined stats')
            debug('after running specs', specs)
            debug(stats)
  }
