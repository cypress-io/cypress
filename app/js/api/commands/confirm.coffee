do (Cypress, _) ->

  Cypress.add

    ## allow the user to choose whether the confirmation
    ## message returns true or false.  need to patch
    ## window.confirm and store the last confirm message
    ## so we can async respond to it?
    confirm: (bool = true) ->