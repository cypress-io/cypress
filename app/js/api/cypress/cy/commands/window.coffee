$Cypress.register "Window", (Cypress, _, $) ->

  viewports = {
    "macbook-15" : "1440x900"
    "macbook-13" : "1280x800"
    "macbook-11" : "1366x768"
    "ipad-2"     : "1024x768"
    "ipad-mini"  : "1024x768"
    "iphone-6+"  : "414x736"
    "iphone-6"   : "375x667"
    "iphone-5"   : "320x568"
    "iphone-4"   : "320x480"
    "iphone-3"   : "320x480"
  }

  validOrientations = ["landscape", "portrait"]

  Cypress.addParentCommand
    title: (options = {}) ->
      _.defaults options, {log: true}

      if options.log
        command = Cypress.Log.command()

      ## TODO: FIX SETTING OPTIONS.LOG TO FALSE HERE
      ## WILL THROW AN ERROR IN THE GET COMMAND
      ## ADDITIONALLY WE SHOULDNT HAVE TO PASS A COMMAND
      ## INTO CY.GET

      # options.command = Cypress.Log.command()

      ## using call here to invoke the 'text' method on the
      ## title's jquery object

      ## we're chaining off the promise so we need to go through
      ## the command method which returns a promise
      @command("get", "title", {
        log: false
        visible: false
        command: command
      }).call("text").then (text) ->
        if command
          command.set({message: text}).snapshot()

        return {subject: text, command: command}

    window: ->
      window = @private("window")
      @throwErr "The remote iframe is undefined!" if not window

      return window

    document: ->
      win = @private("window")
      @throwErr "The remote iframe's document is undefined!" if not win.document
      win.document

    doc: -> @sync.document()

    viewport: (presetOrWidth, heightOrOrientation, options = {}) ->
      if _.isObject(heightOrOrientation)
        options = heightOrOrientation

      _.defaults options, {log: true}

      if options.log
        command = Cypress.Log.command
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

          orientationIsValidAndLandscape = (orientation) =>
            if orientation not in validOrientations
              all = validOrientations.join("' or '")
              @throwErr "cy.viewport can only accept '#{all}' as valid orientations. Your orientation was: '#{orientation}'", command

            orientation is "landscape"

          preset      = presetOrWidth
          orientation = heightOrOrientation

          ## get preset, split by x, convert to a number
          dimensions = getPresetDimensions(preset)

          if _.isString(orientation)
            if orientationIsValidAndLandscape(orientation)
              dimensions.reverse()

          [width, height] = dimensions

        when widthAndHeightAreValidNumbers(presetOrWidth, heightOrOrientation)
          width = presetOrWidth
          height = heightOrOrientation

          if not widthAndHeightAreWithinBounds(width, height)
            @throwErr "cy.viewport width and height must be between 200px and 3000px.", command

        else
          throwErrBadArgs()

      @private("viewportWidth", width)
      @private("viewportHeight", height)

      viewport = {viewportWidth: width, viewportHeight: height}

      Cypress.trigger "viewport", viewport

      if command
        command.set(viewport).snapshot()

      return {subject: null, command: command}