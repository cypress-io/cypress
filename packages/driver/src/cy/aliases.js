_ = require("lodash")

$errUtils = require("../cypress/error_utils")

aliasRe = /^@.+/
aliasDisplayRe = /^([@]+)/
requestXhrRe = /\.request$/

blacklist = ["test", "runnable", "timeout", "slow", "skip", "inspect"]

aliasDisplayName = (name) ->
  name.replace(aliasDisplayRe, "")

getXhrTypeByAlias = (alias) ->
  if requestXhrRe.test(alias) then "request" else "response"

validateAlias = (alias) ->
  if not _.isString(alias)
    $errUtils.throwErrByPath "as.invalid_type"

  if aliasDisplayRe.test(alias)
    $errUtils.throwErrByPath "as.invalid_first_token", {
      args: {
        alias,
        suggestedName: alias.replace(aliasDisplayRe, '')
      }
    }

  if _.isBlank(alias)
    $errUtils.throwErrByPath "as.empty_string"

  if alias in blacklist
    $errUtils.throwErrByPath "as.reserved_word", { args: { alias } }

create = (state) ->
  addAlias = (ctx, aliasObj) ->
    { alias, subject } = aliasObj

    aliases = state("aliases") ? {}
    aliases[alias] = aliasObj
    state("aliases", aliases)

    remoteSubject = cy.getRemotejQueryInstance(subject)

    ## assign the subject to our runnable ctx
    ctx[alias] = remoteSubject ? subject

  getNextAlias = ->
    next = state("current").get("next")

    if next and next.get("name") is "as"
      next.get("args")[0]

  getAlias = (name, cmd, log) ->
    aliases = state("aliases") ? {}

    ## bail if the name doesnt reference an alias
    return if not aliasRe.test(name)

    ## slice off the '@'
    if not alias = aliases[name.slice(1)]
      aliasNotFoundFor(name, cmd, log)

    return alias

  getAvailableAliases = ->
    return [] if not aliases = state("aliases")

    _.keys(aliases)

  aliasNotFoundFor = (name, cmd, log) ->
    availableAliases = getAvailableAliases()

    ## throw a very specific error if our alias isnt in the right
    ## format, but its word is found in the availableAliases
    if (not aliasRe.test(name)) and (name in availableAliases)
      displayName = aliasDisplayName(name)
      $errUtils.throwErrByPath "alias.invalid", {
        onFail: log
        args: { name, displayName }
      }

    cmd ?= log and log.get("name") or state("current").get("name")
    displayName = aliasDisplayName(name)

    errPath = if availableAliases.length
      "alias.not_registered_with_available"
    else
      "alias.not_registered_without_available"

    $errUtils.throwErrByPath errPath, {
      onFail: log
      args: { cmd, displayName, availableAliases: availableAliases.join(", ") }
    }

  return {
    getAlias

    addAlias

    ## these are public because its expected other commands
    ## know about them and are expected to call them
    getNextAlias

    validateAlias

    aliasNotFoundFor

    getXhrTypeByAlias

    getAvailableAliases
  }

module.exports = {
  create
}
