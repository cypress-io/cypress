$Cypress.register "Window", (Cypress, _, $) ->

  viewports = {
    "macbook-15" : "1440x900"
    "macbook-13" : "1280x800"
    "macbook-11" : "1366x768"
    "ipad-2"     : "1024x768"
    "ipad-mini"  : "1024x768"
    "ipad-mini-2": "2048x1536"
    "ipad-3"     : "2048x1536"
    "ipad-4"     : "2048x1536"
    "iphone-6+"  : "1920x1080"
    "iphone-6"   : "1334x750"
    "iphone-5"   : "1136x640"
    "iphone-4"   : "960x640"
    "iphone-3"   : "320x480"
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

    viewport: (presetOrWidth, height, options = {}) ->
      if _.isObject(height)
        options = height

      _.defaults options,
        log: true

      if options.log
        command = Cypress.command
          onConsole: ->
            obj = {}
            obj.Preset = preset if preset
            obj.Width  = width
            obj.Height = height
            obj

      throwErrBadArgs = =>
        @throwErr "cy.viewport can only accept a string preset or a width and height as numbers.", command

      widthAndHeightAreValidNumbers = (width, height) ->
        _.all [width, height], (val) ->
          _.isNumber(val) and _.isFinite(val)

      widthAndHeightAreWithinBounds = (width, height) ->
        _.all [width, height], (val) ->
          val > 200 and val < 3000

      switch
        when _.isString(presetOrWidth) and _.isBlank(presetOrWidth)
          @throwErr "cy.viewport cannot be passed an empty string.", command

        when _.isString(presetOrWidth)
          getPresetDimensions = (preset) =>
            try
              _(viewports[presetOrWidth].split("x")).map(Number)
            catch e
              presets = _.keys(viewports).join(", ")
              @throwErr "cy.viewport could not find a preset for: '#{preset}'. Available presets are: #{presets}", command

          preset = presetOrWidth

          ## get preset, split by x, convert to a number
          [width, height] = getPresetDimensions(preset)

        when widthAndHeightAreValidNumbers(presetOrWidth, height)
          width = presetOrWidth

          if not widthAndHeightAreWithinBounds(width, height)
            @throwErr "cy.viewport width and height must be between 200px and 3000px.", command

        else
          throwErrBadArgs()

      @private("viewportWidth", width)
      @private("viewportHeight", height)

      viewport = {viewportWidth: width, viewportHeight: height}

      Cypress.trigger "viewport", viewport

      if command
        command.set(viewport).snapshot().end()

      return null