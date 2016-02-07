os       = require("os")
git      = require("gift")
Promise  = require("bluebird")
api      = require("../../api")
errors   = require("./errors")
project  = require("./project")
headless = require("./headless")

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

  getBranch: (repo) ->
    for branch in ["CIRCLE_BRANCH", "TRAVIS_BRANCH", "CI_BRANCH"]
      if b = process.env[branch]
        return Promise.resolve(b)

    @getBranchFromGit(repo)

  ensureCi: ->
    Promise.try =>
      ## TODO: this method is going to change. we'll soon by
      ## removing CI restrictions once we're spinning up instances
      return #if os.platform() is "linux"

      errors.throw("NOT_CI_ENVIRONMENT")

  ensureProjectAPIToken: (projectId, projectPath, key) ->
    repo = Promise.promisifyAll git(projectPath)

    Promise.props({
      branch:  @getBranch(repo)
      author:  @getAuthor(repo)
      message: @getMessage(repo)
    })
    .then (git) ->
      api.createCiGuid({
        key:       key
        projectId: projectId
        branch:    git.branch
        author:    git.author
        message:   git.message
      })
      .catch (err) ->
        if err.statusCode is 401
          key = key.slice(0, 5) + "..." + key.slice(-5)
          errors.throw("CI_KEY_NOT_VALID")
        else
          errors.throw("CI_CANNOT_COMMUNICATE")

  run: (app, options) ->
    {projectPath} = options

    @ensureCi()
    .then ->
      project.add(projectPath)
    .then ->
      project.id(projectPath)
    .then (id) =>
      @ensureProjectAPIToken(id, projectPath, options.key)
    .then (ciGuid) ->
      options.ci_guid = ciGuid
      headless.run(app, options)
}