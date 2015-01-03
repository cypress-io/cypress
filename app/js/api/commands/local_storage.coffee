do (Cypress, _) ->

  Cypress.addParentCommand

    clearLocalStorage: (keys) ->
      ## bail if we have keys and we're not a string and we're not a regexp
      if keys and not _.isString(keys) and not _.isRegExp(keys)
        @throwErr("cy.clearLocalStorage() must be called with either a string or regular expression!")

      local = window.localStorage
      remote = cy.sync.window().localStorage

      ## set our localStorage and the remote localStorage
      Cypress.LocalStorage.setStorages(local, remote)

      ## clear the keys
      Cypress.LocalStorage.clear(keys)

      ## and then unset the references
      Cypress.LocalStorage.unsetStorages()

      Cypress.log
        name: "clear ls"

      ## return the remote local storage object
      return remote