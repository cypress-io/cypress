_        = require("lodash")
os       = require("os")
git      = require("gift")
chalk    = require("chalk")
Promise  = require("bluebird")
headless = require("./headless")
api      = require("../api")
logger   = require("../logger")
errors   = require("../errors")
upload   = require("../upload")
Project  = require("../project")
terminal = require("../util/terminal")

logException = (err) ->
  ## give us up to 1 second to
  ## create this exception report
  logger.createException(err)
  .timeout(1000)
  .catch ->
    ## dont yell about any errors either

module.exports = {
  getBranchFromGit: (repo) ->
    repo.branchAsync()
    .get("name")
    .catch -> ""

  getMessage: (repo) ->
    repo.current_commitAsync()
    .get("message")
    .catch -> ""

  getAuthor: (repo) ->
    repo.current_commitAsync()
    .get("author")
    .get("name")
    .catch -> ""

  getSha: (repo) ->
    repo.current_commitAsync()
    .get("id")
    .catch -> ""

  getBranch: (repo) ->
    for branch in ["CIRCLE_BRANCH", "TRAVIS_BRANCH", "CI_BRANCH"]
      if b = process.env[branch]
        return Promise.resolve(b)

    @getBranchFromGit(repo)

  ensureProjectAPIToken: (projectId, projectPath, projectName, projectToken) ->
    if not projectToken
      return errors.throw("CI_KEY_MISSING")

    repo = Promise.promisifyAll git(projectPath)

    Promise.props({
      sha:     @getSha(repo)
      branch:  @getBranch(repo)
      author:  @getAuthor(repo)
      message: @getMessage(repo)
    })
    .then (git) ->
      api.createBuild({
        projectId:     projectId
        projectToken:  projectToken
        commitSha:     git.sha
        commitBranch:  git.branch
        commitAuthor:  git.author
        commitMessage: git.message
      })
      .catch (err) ->
        switch err.statusCode
          when 401
            projectToken = projectToken.slice(0, 5) + "..." + projectToken.slice(-5)
            errors.throw("CI_KEY_NOT_VALID", projectToken)
          when 404
            errors.throw("CI_PROJECT_NOT_FOUND")
          else
            ## warn the user that assets will be not recorded
            errors.warning("CI_CANNOT_CREATE_BUILD_OR_INSTANCE", err)

            ## report on this exception
            ## and return null
            logException(err)
            .return(null)

  upload: (options = {}) ->
    {video, screenshots, videoUrl, screenshotUrls} = options

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
        upload(pathToFile, url)
        .then(success)
        .catch(fail)
      )

    if videoUrl
      send(video, videoUrl)

    if screenshotUrls
      screenshotUrls.forEach (obj) ->
        screenshot = _.find(screenshots, {clientId: obj.clientId})

        send(screenshot.path, obj.uploadUrl)

    Promise.all(uploads)

  uploadAssets: (buildId, stats) ->
    console.log("")
    console.log("")

    terminal.header("Uploading Assets", {
      color: ["blue"]
    })

    console.log("")

    ## get rid of the path property
    screenshots = _.map stats.screenshots, (screenshot) ->
      _.omit(screenshot, "path")

    api.createInstance({
      buildId:      buildId
      tests:        stats.tests
      duration:     stats.duration
      passes:       stats.passes
      failures:     stats.failures
      pending:      stats.pending
      video:        !!stats.video
      screenshots:  screenshots
      failingTests: stats.failingTests
    })
    .then (resp) =>
      @upload({
        video:          stats.video
        screenshots:    stats.screenshots
        videoUrl:       resp.videoUploadUrl
        screenshotUrls: resp.screenshotUploadUrls
      })
      .catch (err) ->
        errors.warning("CI_CANNOT_UPLOAD_ASSETS", err)

        logException(err)
    .catch (err) ->
      errors.warning("CI_CANNOT_CREATE_BUILD_OR_INSTANCE", err)

      ## dont log exceptions if we have a 503 status code
      logException(err) unless err.statusCode is 503

  run: (options) ->
    {projectPath} = options

    Project.add(projectPath)
    .then ->
      Project.id(projectPath)
    .then (projectId) =>
      Project.config(projectPath)
      .then (cfg) =>
        {projectName} = cfg

        @ensureProjectAPIToken(projectId, projectPath, projectName, options.key)
        .then (buildId) =>
          ## dont check that the user is logged in
          options.ensureSession = false

          ## dont let headless say its all done
          options.allDone       = false

          headless.run(options)
          .then (stats = {}) =>
            ## if we got a buildId then attempt to
            ## upload these assets
            if buildId
              @uploadAssets(buildId, stats)
              .return(stats)
              .finally(headless.allDone)
            else
              stats
}