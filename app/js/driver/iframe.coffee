do (parent = window.opener or window.parent) ->
  window.Cypress = parent.Cypress

  if not Cypress
    throw new Error("Tests cannot run without a reference to Cypress!")

  Cypress.window(window)