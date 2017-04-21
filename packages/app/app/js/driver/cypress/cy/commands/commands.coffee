$Cypress.register "Commands", (Cypress, _) ->

  ## here we are extending both the Cy prototype
  ## and the Chainer prototype to allow 'cmd' and 'command'
  ## as chainable methods. However these avoid the inject
  ## problem thus avoiding being queue'd as commands. instead
  ## we simply evaluate them and whatever command they are trying
  ## to call, we push onto the command queue. perfect

  command = (name, args...) ->
    ## continue chaining or call off cy
    ctx = @prop("chain") ? @

    if not ctx[name]?
      cmds = _.keys(Cypress.Chainer.prototype).join(", ")
      $Cypress.Utils.throwErrByPath("miscellaneous.invalid_command", {
        args: { name, cmds }
      })

    ctx[name].apply(ctx, args)

  Cypress.Cy.extend
    cmd: ->
      command.apply(@, arguments)

    command: ->
      command.apply(@, arguments)

  ["cmd", "command"].forEach (val) ->
    Cypress.Chainer.inject val, (id, args) ->
      command.apply(@, args)
