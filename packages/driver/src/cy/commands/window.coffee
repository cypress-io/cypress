_ = require("lodash")
Promise = require("bluebird")

$errUtils = require("../../cypress/error_utils")

viewports = {
  "macbook-15" : "1440x900"
  "macbook-13" : "1280x800"
  "macbook-11" : "1366x768"
  "ipad-2"     : "768x1024"
  "ipad-mini"  : "768x1024"
  "iphone-xr"  : "414x896"
  "iphone-x"   : "375x812"
  "iphone-6+"  : "414x736"
  "iphone-6"   : "375x667"
  "iphone-5"   : "320x568"
  "iphone-4"   : "320x480"
  "iphone-3"   : "320x480"
  "samsung-s10" : "360x760"
  "samsung-note9" : "414x846"
}

validOrientations = ["landscape", "portrait"]

## NOTE: this is outside the function because its 'global' state to the
## cypress application and not local to the specific run. the last
## viewport set is always the 'current' viewport as opposed to the
## config. there was a bug where re-running tests without a hard
## refresh would cause viewport to hang
currentViewport = null

module.exports = (Commands, Cypress, cy, state, config) ->
  defaultViewport = _.pick(config(), "viewportWidth", "viewportHeight")

  ## currentViewport could already be set due to previous runs
  currentViewport ?= defaultViewport

  Cypress.on "test:before:run:async", ->
    ## if we have viewportDefaults it means
    ## something has changed the default and we
    ## need to restore prior to running the next test
    ## after which we simply null and wait for the
    ## next viewport change
    setViewportAndSynchronize(defaultViewport.viewportWidth, defaultViewport.viewportHeight)

  setViewportAndSynchronize = (width, height) ->
    viewport = {viewportWidth: width, viewportHeight: height}

    ## store viewport on the state for logs
    state(viewport)

    new Promise (resolve) ->
      if currentViewport.viewportWidth is width and currentViewport.viewportHeight is height
        ## noop if viewport won't change
        return resolve(currentViewport)

      currentViewport = {
        viewportWidth: width
        viewportHeight: height
      }

      ## force our UI to change to the viewport and wait for it
      ## to be updated
      Cypress.action "cy:viewport:changed", viewport, ->
        resolve(viewport)

  Commands.addAll({
    title: (options = {}) ->
      _.defaults options, {log: true}

      if options.log
        options._log = Cypress.log()

      do resolveTitle = =>
        doc = state("document")

        title = (doc and doc.title) or ""

        cy.verifyUpcomingAssertions(title, options, {
          onRetry: resolveTitle
        })

    window: (options = {}) ->
      _.defaults options, {log: true}

      if options.log
        options._log = Cypress.log()

      getWindow = =>
        window = state("window")
        $errUtils.throwErrByPath("window.iframe_undefined", { onFail: options._log }) if not window

        return window

      ## wrap retrying into its own
      ## separate function
      retryWindow = =>
        Promise
        .try(getWindow)
        .catch (err) =>
          options.error = err
          cy.retry(retryWindow, options)

      do verifyAssertions = =>
        Promise.try(retryWindow).then (win) =>
          cy.verifyUpcomingAssertions(win, options, {
            onRetry: verifyAssertions
          })

    document: (options = {}) ->
      _.defaults options, {log: true}

      if options.log
        options._log = Cypress.log()

      getDocument = =>
        win = state("window")
        ## TODO: add failing test around logging twice
        $errUtils.throwErrByPath("window.iframe_doc_undefined") if not win?.document

        return win.document

      ## wrap retrying into its own
      ## separate function
      retryDocument = =>
        Promise
        .try(getDocument)
        .catch (err) =>
          options.error = err
          cy.retry(retryDocument, options)

      do verifyAssertions = =>
        Promise.try(retryDocument).then (doc) =>
          cy.verifyUpcomingAssertions(doc, options, {
            onRetry: verifyAssertions
          })

    viewport: (presetOrWidth, heightOrOrientation, options = {}) ->
      if _.isObject(heightOrOrientation)
        options = heightOrOrientation

      _.defaults options, {log: true}

      if options.log
        options._log = Cypress.log
          consoleProps: ->
            obj = {}
            obj.Preset = preset if preset
            obj.Width  = width
            obj.Height = height
            obj

      throwErrBadArgs = =>
        $errUtils.throwErrByPath "viewport.bad_args", { onFail: options._log }

      widthAndHeightAreValidNumbers = (width, height) ->
        _.every [width, height], (val) ->
          _.isNumber(val) and _.isFinite(val)

      widthAndHeightAreWithinBounds = (width, height) ->
        _.every [width, height], (val) ->
          val >= 0

      switch
        when _.isString(presetOrWidth) and _.isBlank(presetOrWidth)
          $errUtils.throwErrByPath "viewport.empty_string", { onFail: options._log }

        when _.isString(presetOrWidth)
          getPresetDimensions = (preset) =>
            try
              _.map(viewports[presetOrWidth].split("x"), Number)
            catch e
              presets = _.keys(viewports).join(", ")
              $errUtils.throwErrByPath "viewport.missing_preset", {
                onFail: options._log
                args: { preset, presets }
              }

          orientationIsValidAndLandscape = (orientation) =>
            if orientation not in validOrientations
              all = validOrientations.join("` or `")
              $errUtils.throwErrByPath "viewport.invalid_orientation", {
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
            $errUtils.throwErrByPath "viewport.dimensions_out_of_range", { onFail: options._log }

        else
          throwErrBadArgs()

      setViewportAndSynchronize(width, height)
      .then (viewport) ->
        if options._log
          options._log.set(viewport)

        return null

  })
