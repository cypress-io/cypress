$Cypress.register "Window", (Cypress, _, $) ->

  Cypress.addParentCommand
    title: (options = {}) ->
      options.log = false
      options.visible = false
      options.command = Cypress.command()

      ## using call here to invoke the 'text' method on the
      ## title's jquery object

      ## we're chaining off the promise so we need to go through
      ## the command method which returns a promise
      @command("get", "title", options).call("text").then (text) ->
        options.command.set({message: text})

        options.command.snapshot().end()

        return text

    window: ->
      @throwErr "The remote iframe is undefined!" if not @$remoteIframe
      @$remoteIframe.prop("contentWindow")

    document: ->
      win = @sync.window()
      @throwErr "The remote iframe's document is undefined!" if not win.document
      $(win.document)

    doc: -> @sync.document()