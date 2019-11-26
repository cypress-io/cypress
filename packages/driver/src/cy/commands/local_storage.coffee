_ = require("lodash")

$utils = require("../../cypress/utils")
$Location = require("../../cypress/location")
$LocalStorage = require("../../cypress/local_storage")
debug = require('debug')('cypress:driver:commands:localstorage')


clearLocalStorage = (state, keys) ->
  # debug('window')
  # debug('clearing localstorage for window: ', cy.state('window').location.href)
  local = window
  remote = state("window")

  # ## set our localStorage and the remote localStorage
  # $LocalStorage.setStorages(local, remote)
  
  localHostname = $Location.create(local.location.href).hostname
  remoteHostname = $Location.create(remote.location.href).hostname
  console.log()
  # debugger
  return Cypress.automation("clear:localStorage", { urls: _.compact [localHostname, remoteHostname]} )
  .then ->
    debugger
    console.log('asfdasfasdf')
  # return Cypress.Promise.delay(1000)
  # ## clear the keys
  # $LocalStorage.clear(keys)

  # ## and then unset the references
  # $LocalStorage.unsetStorages()

  # ## return the remote localStorage object
  # return remote

module.exports = (Commands, Cypress, cy, state, config) ->
  ## this MUST be prepended before anything else
  Cypress.prependListener "test:before:run", ->
    try
      ## this may fail if the current
      ## window is bound to another origin
      # clearLocalStorage(state, [])
    catch
      null

  Commands.addAll({
    clearLocalStorage: (keys) ->
      ## bail if we have keys and we're not a string and we're not a regexp
      if keys and not _.isString(keys) and not _.isRegExp(keys)
        $utils.throwErrByPath("clearLocalStorage.invalid_argument")

      remote = clearLocalStorage(state, keys)

      Cypress.log
        name: "clear ls"
        snapshot: true
        end: true

      ## return the remote local storage object
      return remote
  })
