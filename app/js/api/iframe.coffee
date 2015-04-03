do (parent = window.opener or window.parent) ->
  ## proxy Cypress from the parent
  window.Cypress = parent.Cypress
  window.cy      = parent.cy

  if not Cypress
    throw new Error("Tests cannot run without a reference to Cypress!")

  ## proxy chai from our parent
  if parent.chai
    Cypress.Chai.setGlobals(window)

  Cypress.Mocha.set(window)

  window.proxyRemoteGlobals = (globals) ->
    throw new Error("Remote iframe window has not been loaded!") if not window.remote
    for global in globals
      window[global] = window.remote[global]