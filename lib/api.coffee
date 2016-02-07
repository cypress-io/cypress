request = require("request-promise")
Routes  = require("./util/routes")

module.exports = {
  createCiGuid: (options = {}) ->
    request.post({
      url: Routes.ci(options.projectId)
      headers: {
        "x-project-token": options.key
        "x-git-branch":    options.branch
        "x-git-author":    options.author
        "x-git-message":   options.message
      }
      json: true
    })
    .promise()
    .get("ci_guid")
}