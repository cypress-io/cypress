Promise = require("bluebird")
chdir = require("chdir-promise")
execa = require("execa")

emptyString = -> ""

gitCommandIn = (pathToRepo, gitCommand) ->
  chdir.to(pathToRepo)
  .then () ->
    execa.shell(gitCommand)
  .tap chdir.back
  .catch emptyString

# See "git show" formats in
# https://git-scm.com/docs/git-show
module.exports = {
  _getBranch: (pathToRepo) ->
    gitCommandIn(pathToRepo, "git rev-parse --abbrev-ref HEAD")
    # repo.branchAsync()
    # .get("name")
    # .catch -> ""

  _getMessage: (repo) ->
    gitCommandIn(pathToRepo, "git show -s --pretty=%m")
    # repo.current_commitAsync()
    # .get("message")
    # .catch -> ""

  _getEmail: (repo) ->
    gitCommandIn(pathToRepo, "git show -s --pretty=%ae")
    # repo.current_commitAsync()
    # .get("author")
    # .get("email")
    # .catch -> ""

  _getAuthor: (repo) ->
    gitCommandIn(pathToRepo, "git show -s --pretty=%an")
    # repo.current_commitAsync()
    # .get("author")
    # .get("name")
    # .catch -> ""

  _getSha: (repo) ->
    gitCommandIn(pathToRepo, "git show -s --pretty=%H")
    # repo.current_commitAsync()
    # .get("id")
    # .catch -> ""

  _getRemoteOrigin: (repo) ->
    gitCommandIn(pathToRepo, "git config --get remote.origin.url")
    # repo.configAsync()
    # .get("items")
    # .get("remote.origin.url")
    # .catch -> ""

  init: (pathToRepo) ->
    # repo ?= Promise.promisifyAll git(pathToRepo)

    return {
      getBranch: @_getBranch.bind(@, pathToRepo)

      getMessage: @_getMessage.bind(@, pathToRepo)

      getEmail: @_getEmail.bind(@, pathToRepo)

      getAuthor: @_getAuthor.bind(@, pathToRepo)

      getSha: @_getSha.bind(@, pathToRepo)

      getRemoteOrigin: @_getRemoteOrigin.bind(@, pathToRepo)
    }
}
