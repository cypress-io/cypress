_ = require("lodash")

$LocalStorage = require("../../local_storage")
$Log = require("../../log")
utils = require("../../utils")

clearLocalStorage = (keys) ->
  local = window.localStorage
  remote = @privateState("window").localStorage

  ## set our localStorage and the remote localStorage
  $LocalStorage.setStorages(local, remote)

  ## clear the keys
  $LocalStorage.clear(keys)

  ## and then unset the references
  $LocalStorage.unsetStorages()

  ## return the remote localStorage object
  return remote

module.exports = (Cypress, Commands) ->
  Cypress.on "test:before:hooks", ->
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
        utils.throwErrByPath("clearLocalStorage.invalid_argument")

      remote = clearLocalStorage.call(@, keys)

      $Log.command
        name: "clear ls"
        snapshot: true
        end: true

      ## return the remote local storage object
      return remote
  })
