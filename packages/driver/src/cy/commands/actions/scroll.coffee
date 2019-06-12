_ = require("lodash")
$ = require("jquery")
Promise = require("bluebird")

$dom = require("../../../dom")
$utils = require("../../../cypress/utils")
$errUtils = require("../../../cypress/error_utils")

findScrollableParent = ($el, win) ->
  $parent = $el.parent()

  ## if we're at the body, we just want to pass in
  ## window into jQuery scrollTo
  if $parent.is("body,html") or $dom.isDocument($parent)
    return win

  return $parent if $dom.isScrollable($parent)

  findScrollableParent($parent, win)

isNaNOrInfinity = (item) ->
  num = Number.parseFloat(item)

  return _.isNaN(num) or !_.isFinite(num)

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addAll({ prevSubject: "element" }, {
    scrollIntoView: (subject, options = {}) ->
      if !_.isObject(options)
        $errUtils.throwErrByPath("scrollIntoView.invalid_argument", {args: { arg: options }})

      ## ensure the subject is not window itself
      ## cause how are you gonna scroll the window into view...
      if subject is state("window")
        $errUtils.throwErrByPath("scrollIntoView.subject_is_window")

      ## throw if we're trying to scroll to multiple elements
      if subject.length > 1
        $errUtils.throwErrByPath("scrollIntoView.multiple_elements", {args: { num: subject.length }})

      _.defaults(options, {
        $el: subject
        $parent: state("window")
        log: true
        duration: 0
        easing: "swing"
        axis: "xy"
      })

      ## figure out the options which actually change the behavior of clicks
      deltaOptions = $utils.filterOutOptions(options)

      ## here we want to figure out what has to actually
      ## be scrolled to get to this element, cause we need
      ## to scrollTo passing in that element.
      options.$parent = findScrollableParent(options.$el, state("window"))

      if options.$parent is state("window")
        parentIsWin = true
        ## jQuery scrollTo looks for the prop contentWindow
        ## otherwise it'll use the wrong window to scroll :(
        options.$parent.contentWindow = options.$parent

      ## if we cannot parse an integer out of duration
      ## which could be 500 or "500", then it's NaN...throw
      if isNaNOrInfinity(options.duration)
        $errUtils.throwErrByPath("scrollIntoView.invalid_duration", {args: { duration: options.duration }})

      if !(options.easing is "swing" or options.easing is "linear")
        $errUtils.throwErrByPath("scrollIntoView.invalid_easing", {args: { easing: options.easing }})

      if options.log
        deltaOptions = $utils.filterOutOptions(options, {duration: 0, easing: 'swing', offset: {left: 0, top: 0}})

        log = {
          $el: options.$el
          message: deltaOptions
          consoleProps: ->
            obj = {
              ## merge into consoleProps without mutating it
              "Applied To": $dom.getElements(options.$el)
              "Scrolled Element": $dom.getElements(options.$el)
            }

            return obj
        }

        options._log = Cypress.log(log)

      if not parentIsWin
        ## scroll the parent into view first
        ## before attemp
        options.$parent[0].scrollIntoView()

      scrollIntoView = ->
        new Promise (resolve, reject) =>
          ## scroll our axes
          $(options.$parent).scrollTo(options.$el, {
            axis:     options.axis
            easing:   options.easing
            duration: options.duration
            offset:   options.offset
            done: (animation, jumpedToEnd) ->
              resolve(options.$el)
            fail: (animation, jumpedToEnd) ->
              ## its Promise object is rejected
              try
                $errUtils.throwErrByPath("scrollTo.animation_failed")
              catch err
                reject(err)
            always: ->
              if parentIsWin
                delete options.$parent.contentWindow
          })

      scrollIntoView()
      .then ($el) ->
        do verifyAssertions = ->
          cy.verifyUpcomingAssertions($el, options, {
            onRetry: verifyAssertions
          })
  })

  Commands.addAll({ prevSubject: ["optional", "element", "window"] }, {
    scrollTo: (subject, xOrPosition, yOrOptions, options = {}) ->
      ## check for undefined or null values
      if not xOrPosition?
        $errUtils.throwErrByPath "scrollTo.invalid_target", {args: { x }}

      switch
        when _.isObject(yOrOptions)
          options = yOrOptions
        else
          y = yOrOptions

      position = null

      ## we may be '50%' or 'bottomCenter'
      if _.isString(xOrPosition)
        ## if there's a number in our string, then
        ## don't check for positions and just set x
        ## this will check for NaN, etc - we need to explicitly
        ## include '0%' as a use case
        if (Number.parseFloat(xOrPosition) or Number.parseFloat(xOrPosition) is 0)
          x = xOrPosition
        else
          position = xOrPosition
          ## make sure it's one of the valid position strings
          cy.ensureValidPosition(position)
      else
        x = xOrPosition

      switch position
        when 'topLeft'
          x = 0       # y = 0
        when 'top'
          x = '50%'   # y = 0
        when 'topRight'
          x = '100%'  # y = 0
        when 'left'
          x = 0
          y = '50%'
        when 'center'
          x = '50%'
          y = '50%'
        when 'right'
          x = '100%'
          y = '50%'
        when 'bottomLeft'
          x = 0
          y = '100%'
        when 'bottom'
          x = '50%'
          y = '100%'
        when 'bottomRight'
          x = '100%'
          y = '100%'

      y ?= 0
      x ?= 0

      ## if our subject is window let it fall through
      if subject and (not $dom.isWindow(subject))
        ## if they passed something here, its a DOM element
        $container = subject
      else
        isWin = true
        ## if we don't have a subject, then we are a parent command
        ## assume they want to scroll the entire window.
        $container = state("window")

        ## jQuery scrollTo looks for the prop contentWindow
        ## otherwise it'll use the wrong window to scroll :(
        $container.contentWindow = $container

      ## throw if we're trying to scroll multiple containers
      if (!isWin && $container.length > 1)
        $errUtils.throwErrByPath("scrollTo.multiple_containers", {args: { num: $container.length }})

      _.defaults(options, {
        $el: $container
        log: true
        duration: 0
        easing: "swing"
        axis: "xy"
        x: x
        y: y
      })

      ## if we cannot parse an integer out of duration
      ## which could be 500 or "500", then it's NaN...throw
      if isNaNOrInfinity(options.duration)
        $errUtils.throwErrByPath("scrollTo.invalid_duration", {args: { duration: options.duration }})

      if !(options.easing is "swing" or options.easing is "linear")
        $errUtils.throwErrByPath("scrollTo.invalid_easing", {args: { easing: options.easing }})

      ## if we cannot parse an integer out of y or x
      ## which could be 50 or "50px" or "50%" then
      ## it's NaN/Infinity...throw
      if isNaNOrInfinity(options.y) or isNaNOrInfinity(options.x)
        $errUtils.throwErrByPath("scrollTo.invalid_target", {args: { x, y }})

      if options.log
        deltaOptions = $utils.stringify(
          $utils.filterOutOptions(options, {duration: 0, easing: 'swing'})
        )

        messageArgs = []
        if position
          messageArgs.push(position)
        else
          messageArgs.push(x)
          messageArgs.push(y)
        if deltaOptions
          messageArgs.push(deltaOptions)

        log = {
          message: messageArgs.join(", "),
          consoleProps: ->
            ## merge into consoleProps without mutating it
            obj = {}

            if position
              obj.Position = position
            else
              obj.X = x
              obj.Y = y
            if deltaOptions
              obj.Options = deltaOptions

            obj["Scrolled Element"] = $dom.getElements(options.$el)

            return obj
        }

        if !isWin then log.$el = options.$el

        options._log = Cypress.log(log)

      ensureScrollability = ->
        try
          ## make sure our container can even be scrolled
          cy.ensureScrollability($container, "scrollTo")
        catch err
          options.error = err
          cy.retry(ensureScrollability, options)

      scrollTo = ->
        new Promise (resolve, reject) ->
          ## scroll our axis'
          $(options.$el).scrollTo({left: x, top: y}, {
            axis:     options.axis
            easing:   options.easing
            duration: options.duration
            done: (animation, jumpedToEnd) ->
              resolve(options.$el)
            fail: (animation, jumpedToEnd) ->
              ## its Promise object is rejected
              try
                $errUtils.throwErrByPath("scrollTo.animation_failed")
              catch err
                reject(err)
          })

          if isWin
            delete options.$el.contentWindow

      Promise
      .try(ensureScrollability)
      .then(scrollTo)
      .then ($el) ->
        do verifyAssertions = ->
          cy.verifyUpcomingAssertions($el, options, {
            onRetry: verifyAssertions
          })
  })
