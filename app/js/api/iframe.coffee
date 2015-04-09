do (parent = window.opener or window.parent) ->
  window.Cypress = parent.Cypress

  if not Cypress
    throw new Error("Tests cannot run without a reference to Cypress!")

  Cypress.window(window)

  window.proxyRemoteGlobals = (globals) ->
    throw new Error("Remote iframe window has not been loaded!") if not window.remote
    for global in globals
      window[global] = window.remote[global]