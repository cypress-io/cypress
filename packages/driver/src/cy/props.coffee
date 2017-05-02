module.exports = ($Cy) ->
  $Cy.extend
    state: (key, val) ->
      if arguments.length is 1
        @_state[key]
      else
        @_state[key] = val

    privateState: (key, val) ->
      if arguments.length is 1
        @_privateState[key]
      else
        @_privateState[key] = val
