_ = require("lodash")

$utils = require("../cypress/utils")

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
    $utils.throwErrByPath "as.invalid_type"

  if _.isBlank(alias)
    $utils.throwErrByPath "as.empty_string"

  if alias in blacklist
    $utils.throwErrByPath "as.reserved_word", { args: { alias } }

getCommandsUntilFirstParentOrValidSubject = (command, memo = []) ->
  return null if not command

  ## push these onto the beginning of the commands array
  memo.unshift(command)

  ## break and return the memo
  if command.get("type") is "parent" or cy.isInDom(command.get("subject"))
    return memo

  getCommandsUntilFirstParentOrValidSubject(command.get("prev"), memo)

create = (state) ->
  assign = (str, obj) ->
    state("runnable").ctx[str] = obj

  addAlias = (aliasObj) ->
    { alias, subject } = aliasObj

    aliases = state("aliases") ? {}
    aliases[alias] = aliasObj
    state("aliases", aliases)

    remoteSubject = cy.getRemotejQueryInstance(subject)

    ## assign the subject to our runnable ctx
    assign(alias, remoteSubject ? subject)

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
      $utils.throwErrByPath "alias.invalid", {
        onFail: log
        args: { name, displayName }
      }

    cmd ?= log and log.get("name") or state("current").get("name")
    displayName = aliasDisplayName(name)

    errPath = if availableAliases.length
      "alias.not_registered_with_available"
    else
      "alias.not_registered_without_available"

    $utils.throwErrByPath errPath, {
      onFail: log
      args: { cmd, displayName, availableAliases: availableAliases.join(", ") }
    }

  replayFrom = (current) ->
    ## reset each chainerId to the
    ## current value
    chainerId = state("chainerId")

    insert = (commands) =>
      _.each commands, (cmd) =>
        cmd.set("chainerId", chainerId)

        ## clone the command to prevent
        ## mutating its properties
        @insertCommand cmd.clone()

    ## - starting with the aliased command
    ## - walk up to each prev command
    ## - until you reach a parent command
    ## - or until the subject is in the DOM
    ## - from that command walk down inserting
    ##   every command which changed the subject
    ## - coming upon an assertion should only be
    ##   inserted if the previous command should
    ##   be replayed

    commands = getCommandsUntilFirstParentOrValidSubject(current)

    if commands
      initialCommand = commands.shift()

      insert _.reduce commands, (memo, command, index) ->
        push = ->
          memo.push(command)

        switch
          when command.get("type") is "assertion"
            ## if we're an assertion and the prev command
            ## is in the memo, then push this one
            if command.get("prev") in memo
              push()

          when command.get("subject") isnt initialCommand.get("subject")
            ## when our subjects dont match then
            ## reset the initialCommand to this command
            ## so the next commands can compare against
            ## this one to figure out the changing subjects
            initialCommand = command

            push()

        return memo

      , [initialCommand]

  return {
    getAlias

    addAlias

    ## recursively inserts previous commands
    replayFrom

    ## these are public because its expected other commands
    ## know about them and are expected to call them
    getNextAlias

    validateAlias

    getXhrTypeByAlias

    getAvailableAliases
  }

module.exports = {
  create
}
