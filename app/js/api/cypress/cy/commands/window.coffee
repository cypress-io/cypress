$Cypress.register "Window", (Cypress, _, $) ->

  viewports = {
    "macbook-15": "1440x900"
    "macbook-13": "1280x800"
    "macbook-11": "1366x768"
    "iphone-6+" : "1920x1080"
    "iphone-6"  : "1334x750"
    "iphone-5"  : "1136x640"
    "iphone-4"  : "960x640"
    "iphone-3"  : "320x480"
  }

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
      window = @private("window")
      @throwErr "The remote iframe is undefined!" if not window

      return window

    document: ->
      win = @private("window")
      @throwErr "The remote iframe's document is undefined!" if not win.document
      win.document

    doc: -> @sync.document()

    viewport: (presetOrWidth, height, options) ->
      if _.isString(presetOrWidth)
        ## get preset, split by x, convert to a number
        [width, height] = _(viewports[presetOrWidth].split("x")).map(Number)
      else
        width = presetOrWidth

      Cypress.trigger "viewport", {width: width, height: height}

      return null