Promise = require("bluebird")
chdir = require("chdir-promise")
execa = require("execa")
{prop} = require("ramda")
debug = require("debug")("cypress:server")
la = require("lazy-ass")
check = require("check-more-types")

emptyString = -> ""

gitCommandIn = (pathToRepo, gitCommand) ->
  la(check.unemptyString(pathToRepo), "missing repo path", pathToRepo)
  la(check.unemptyString(gitCommand), "missing git command", gitCommand)
  la(gitCommand.startsWith("git"), "invalid git command", gitCommand)

  chdir.to(pathToRepo)
  .then () ->
    debug("running git command: %s", gitCommand)
    execa.shell(gitCommand)
    .then prop("stdout")
  .tap chdir.back
  .catch emptyString

# previous library gift returns "" for detached checkouts
# and our current command returns "HEAD"
# so we must imitate old behavior
checkIfDetached = (branch) ->
  if branch == "HEAD"
    ""
  else
    branch

# See "git show" formats in
# https://git-scm.com/docs/git-show
module.exports = {
  _getBranch: (pathToRepo) ->
    gitCommandIn(pathToRepo, "git rev-parse --abbrev-ref HEAD")
    .then checkIfDetached
    .tap (branch) ->
      debug("got git branch %s", branch)

  # returns subject and body as single string
  _getMessage: (pathToRepo) ->
    gitCommandIn(pathToRepo, "git show -s --pretty=%B")

  _getEmail: (pathToRepo) ->
    gitCommandIn(pathToRepo, "git show -s --pretty=%ae")
    .tap (email) ->
      debug("got git email %s", email)

  _getAuthor: (pathToRepo) ->
    gitCommandIn(pathToRepo, "git show -s --pretty=%an")
    .tap (authorName) ->
      debug("got git author name %s", authorName)

  _getSha: (pathToRepo) ->
    gitCommandIn(pathToRepo, "git show -s --pretty=%H")

  _getRemoteOrigin: (pathToRepo) ->
    gitCommandIn(pathToRepo, "git config --get remote.origin.url")
    .tap (remote) ->
      debug("got git remote %s", remote)

  init: (pathToRepo = process.cwd()) ->

    return {
      getBranch: @_getBranch.bind(@, pathToRepo)

      getMessage: @_getMessage.bind(@, pathToRepo)

      getEmail: @_getEmail.bind(@, pathToRepo)

      getAuthor: @_getAuthor.bind(@, pathToRepo)

      getSha: @_getSha.bind(@, pathToRepo)

      getRemoteOrigin: @_getRemoteOrigin.bind(@, pathToRepo)
    }
}
