_ = require("lodash")

$LocalStorage = require("../../cypress/local_storage")
$Log = require("../../cypress/log")
$utils = require("../../cypress/utils")

clearLocalStorage = (keys) ->
  local = window.localStorage
  remote = @state("window").localStorage

  ## set our localStorage and the remote localStorage
  $LocalStorage.setStorages(local, remote)

  ## clear the keys
  $LocalStorage.clear(keys)

  ## and then unset the references
  $LocalStorage.unsetStorages()

  ## return the remote localStorage object
  return remote

module.exports = (Commands, Cypress, cy, state, config) ->
  Cypress.on "test:before:run", ->
    try
      ## this may fail if the current
      ## window is bound to another origin
      clearLocalStorage.call(@, [])
    catch
      null

  Commands.addAll({
    clearLocalStorage: (keys) ->
      ## bail if we have keys and we're not a string and we're not a regexp
      if keys and not _.isString(keys) and not _.isRegExp(keys)
        $utils.throwErrByPath("clearLocalStorage.invalid_argument")

      remote = clearLocalStorage.call(@, keys)

      Cypress.log
        name: "clear ls"
        snapshot: true
        end: true

      ## return the remote local storage object
      return remote
  })
