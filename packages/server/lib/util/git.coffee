Promise = require("bluebird")
chdir = require("chdir-promise")
execa = require("execa")
{prop} = require("ramda")
debug = require("debug")("cypress:server")

emptyString = -> ""

gitCommandIn = (pathToRepo, gitCommand) ->
  chdir.to(pathToRepo)
  .then () ->
    debug("running git command: %s", gitCommand)
    execa.shell(gitCommand)
    .then prop("stdout")
  .tap chdir.back
  .catch emptyString

# See "git show" formats in
# https://git-scm.com/docs/git-show
module.exports = {
  _getBranch: (pathToRepo) ->
    gitCommandIn(pathToRepo, "git rev-parse --abbrev-ref HEAD")
    .tap (branch) ->
      debug("got git branch %s", branch)
    # repo.branchAsync()
    # .get("name")
    # .catch -> ""

  _getMessage: (pathToRepo) ->
    gitCommandIn(pathToRepo, "git show -s --pretty=%B")
    # repo.current_commitAsync()
    # .get("message")
    # .catch -> ""

  _getEmail: (pathToRepo) ->
    gitCommandIn(pathToRepo, "git show -s --pretty=%ae")
    .tap (email) ->
      debug("got git email %s", email)
    # repo.current_commitAsync()
    # .get("author")
    # .get("email")
    # .catch -> ""

  _getAuthor: (pathToRepo) ->
    gitCommandIn(pathToRepo, "git show -s --pretty=%an")
    # repo.current_commitAsync()
    # .get("author")
    # .get("name")
    # .catch -> ""

  _getSha: (pathToRepo) ->
    gitCommandIn(pathToRepo, "git show -s --pretty=%H")
    # repo.current_commitAsync()
    # .get("id")
    # .catch -> ""

  _getRemoteOrigin: (pathToRepo) ->
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
