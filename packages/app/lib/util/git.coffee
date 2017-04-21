git     = require("gift")
Promise = require("bluebird")

module.exports = {
  _getBranch: (repo) ->
    repo.branchAsync()
    .get("name")
    .catch -> ""

  _getMessage: (repo) ->
    repo.current_commitAsync()
    .get("message")
    .catch -> ""

  _getEmail: (repo) ->
    repo.current_commitAsync()
    .get("author")
    .get("email")
    .catch -> ""

  _getAuthor: (repo) ->
    repo.current_commitAsync()
    .get("author")
    .get("name")
    .catch -> ""

  _getSha: (repo) ->
    repo.current_commitAsync()
    .get("id")
    .catch -> ""

  _getRemoteOrigin: (repo) ->
    repo.configAsync()
    .get("items")
    .get("remote.origin.url")
    .catch -> ""

  init: (pathToRepo, repo) ->
    repo ?= Promise.promisifyAll git(pathToRepo)

    return {
      getBranch: @_getBranch.bind(@, repo)

      getMessage: @_getMessage.bind(@, repo)

      getEmail: @_getEmail.bind(@, repo)

      getAuthor: @_getAuthor.bind(@, repo)

      getSha: @_getSha.bind(@, repo)

      getRemoteOrigin: @_getRemoteOrigin.bind(@, repo)
    }
}
