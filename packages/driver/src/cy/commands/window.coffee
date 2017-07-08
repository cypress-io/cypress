_ = require("lodash")
Promise = require("bluebird")

$Log = require("../../cypress/log")
$utils = require("../../cypress/utils")

## hold a global reference to defaults
viewportDefaults = null

viewports = {
  "macbook-15" : "1440x900"
  "macbook-13" : "1280x800"
  "macbook-11" : "1366x768"
  "ipad-2"     : "768x1024"
  "ipad-mini"  : "768x1024"
  "iphone-6+"  : "414x736"
  "iphone-6"   : "375x667"
  "iphone-5"   : "320x568"
  "iphone-4"   : "320x480"
  "iphone-3"   : "320x480"
}

validOrientations = ["landscape", "portrait"]

create = (Cypress, Commands) ->
  Cypress.on "test:before:hooks", ->
    ## if we have viewportDefaults it means
    ## something has changed the default and we
    ## need to restore prior to running the next test
    ## after which we simply null and wait for the
    ## next viewport change
    if d = viewportDefaults
      triggerAndSetViewport.call(@, d.viewportWidth, d.viewportHeight)
      viewportDefaults = null

  triggerAndSetViewport = (width, height) ->
    Cypress.config("viewportWidth", width)
    Cypress.config("viewportHeight", height)

    viewport = {viewportWidth: width, viewportHeight: height}

    ## force our UI to change to the viewport
    Cypress.trigger "viewport", viewport

    return viewport

  Commands.addAll({
    title: (options = {}) ->
      _.defaults options, {log: true}

      if options.log
        options._log = $Log.command()

      do resolveTitle = =>
        doc = @state("document")

        title = (doc and doc.title) or ""

        @verifyUpcomingAssertions(title, options, {
          onRetry: resolveTitle
        })

    window: (options = {}) ->
      _.defaults options, {log: true}

      if options.log
        options._log = $Log.command()

      getWindow = =>
        window = @state("window")
        $utils.throwErrByPath("window.iframe_undefined", { onFail: options._log }) if not window

        return window

      ## wrap retrying into its own
      ## separate function
      retryWindow = =>
        Promise
        .try(getWindow)
        .catch (err) =>
          options.error = err
          @_retry(retryWindow, options)

      do verifyAssertions = =>
        Promise.try(retryWindow).then (win) =>
          @verifyUpcomingAssertions(win, options, {
            onRetry: verifyAssertions
          })

    document: (options = {}) ->
      _.defaults options, {log: true}

      if options.log
        options._log = $Log.command()

      getDocument = =>
        win = @privateState("window")
        ## TODO: add failing test around logging twice
        $utils.throwErrByPath("window.iframe_doc_undefined") if not win?.document

        return win.document

      ## wrap retrying into its own
      ## separate function
      retryDocument = =>
        Promise
          .try(getDocument)
          .catch (err) =>
            options.error = err
            @_retry(retryDocument, options)

      do verifyAssertions = =>
        Promise.try(retryDocument).then (doc) =>
          @verifyUpcomingAssertions(doc, options, {
            onRetry: verifyAssertions
          })

    viewport: (presetOrWidth, heightOrOrientation, options = {}) ->
      if _.isObject(heightOrOrientation)
        options = heightOrOrientation

      _.defaults options, {log: true}

      if options.log
        options._log = $Log.command
          consoleProps: ->
            obj = {}
            obj.Preset = preset if preset
            obj.Width  = width
            obj.Height = height
            obj

      throwErrBadArgs = =>
        $utils.throwErrByPath "viewport.bad_args", { onFail: options._log }

      widthAndHeightAreValidNumbers = (width, height) ->
        _.every [width, height], (val) ->
          _.isNumber(val) and _.isFinite(val)

      widthAndHeightAreWithinBounds = (width, height) ->
        _.every [width, height], (val) ->
          val >= 200 and val <= 3000

      switch
        when _.isString(presetOrWidth) and _.isBlank(presetOrWidth)
          $utils.throwErrByPath "viewport.empty_string", { onFail: options._log }

        when _.isString(presetOrWidth)
          getPresetDimensions = (preset) =>
            try
              _.map(viewports[presetOrWidth].split("x"), Number)
            catch e
              presets = _.keys(viewports).join(", ")
              $utils.throwErrByPath "viewport.missing_preset", {
                onFail: options._log
                args: { preset, presets }
              }

          orientationIsValidAndLandscape = (orientation) =>
            if orientation not in validOrientations
              all = validOrientations.join("' or '")
              $utils.throwErrByPath "viewport.invalid_orientation", {
                onFail: options._log
                args: { all, orientation }
              }

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
            $utils.throwErrByPath "viewport.dimensions_out_of_range", { onFail: options._log }

        else
          throwErrBadArgs()

      ## backup the previous viewport defaults
      ## if they dont already exist!
      if not viewportDefaults
        viewportDefaults = _.pick(@Cypress.config(), "viewportWidth", "viewportHeight")

      viewport = triggerAndSetViewport.call(@, width, height)

      if options._log
        options._log.set(viewport)

      return null
  })


module.exports = {
  create
}
