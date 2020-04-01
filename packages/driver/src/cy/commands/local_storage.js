_ = require("lodash")

$errUtils = require("../../cypress/error_utils")
$LocalStorage = require("../../cypress/local_storage")

clearLocalStorage = (state, keys) ->
  local = window.localStorage
  remote = state("window").localStorage

  ## set our localStorage and the remote localStorage
  $LocalStorage.setStorages(local, remote)

  ## clear the keys
  $LocalStorage.clear(keys)

  ## and then unset the references
  $LocalStorage.unsetStorages()

  ## return the remote localStorage object
  return remote

module.exports = (Commands, Cypress, cy, state, config) ->
  ## this MUST be prepended before anything else
  Cypress.prependListener "test:before:run", ->
    try
      ## this may fail if the current
      ## window is bound to another origin
      clearLocalStorage(state, [])
    catch
      null

  Commands.addAll({
    clearLocalStorage: (keys, options = {}) ->
      if _.isPlainObject(keys)
        options = keys
        keys = null

      _.defaults options, {log: true}
      
      ## bail if we have keys and we're not a string and we're not a regexp
      if keys and not _.isString(keys) and not _.isRegExp(keys)
        $errUtils.throwErrByPath("clearLocalStorage.invalid_argument")

      remote = clearLocalStorage(state, keys)

      if options.log
        Cypress.log
          name: "clear ls"
          snapshot: true
          end: true

      ## return the remote local storage object
      return remote
  })
