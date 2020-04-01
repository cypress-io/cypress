_ = require("lodash")

$utils = require("./utils")
$errUtils = require("./error_utils")

reset = -> {
  capture: "fullPage"
  scale: false
  disableTimersAndAnimations: true
  screenshotOnRunFailure: true
  blackout: []
  onBeforeScreenshot: ->
  onAfterScreenshot: ->
}

defaults = reset()

validCaptures = ["fullPage", "viewport", "runner"]

normalizePadding = (padding) ->
  padding ||= 0

  if _.isArray(padding)
    # CSS shorthand
    # See: https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties#Tricky_edge_cases
    switch padding.length
      when 1
        top = right = bottom = left = padding[0]
      when 2
        top = bottom = padding[0]
        right = left = padding[1]
      when 3
        top = padding[0]
        right = left = padding[1]
        bottom = padding[2]
      when 4
        top = padding[0]
        right = padding[1]
        bottom = padding[2]
        left = padding[3]
  else
    top = right = bottom = left = padding

  return [
    top
    right
    bottom
    left
  ]

validateAndSetBoolean = (props, values, cmd, log, option) ->
  value = props[option]
  if not value?
    return

  if not _.isBoolean(value)
    $errUtils.throwErrByPath("screenshot.invalid_boolean", {
      log: log
      args: {
        cmd: cmd
        option: option
        arg: $utils.stringify(value)
      }
    })

  values[option] = value

validateAndSetCallback = (props, values, cmd, log, option) ->
  value = props[option]
  if not value?
    return

  if not _.isFunction(value)
    $errUtils.throwErrByPath("screenshot.invalid_callback", {
      log: log
      args: {
        cmd: cmd
        callback: option
        arg: $utils.stringify(value)
      }
    })

  values[option] = value

validate = (props, cmd, log) ->
  values = {}

  if not _.isPlainObject(props)
    $errUtils.throwErrByPath("screenshot.invalid_arg", {
      log: log
      args: { cmd: cmd, arg: $utils.stringify(props) }
    })

  if capture = props.capture
    if not (capture in validCaptures)
      $errUtils.throwErrByPath("screenshot.invalid_capture", {
        log: log
        args: { cmd: cmd, arg: $utils.stringify(capture) }
      })

    values.capture = capture

  validateAndSetBoolean(props, values, cmd, log, "scale")
  validateAndSetBoolean(props, values, cmd, log, "disableTimersAndAnimations")
  validateAndSetBoolean(props, values, cmd, log, "screenshotOnRunFailure")

  if blackout = props.blackout
    if not _.isArray(blackout) or _.some(blackout, (selector) -> not _.isString(selector))
      $errUtils.throwErrByPath("screenshot.invalid_blackout", {
        log: log
        args: { cmd: cmd, arg: $utils.stringify(blackout) }
      })

    values.blackout = blackout

  if clip = props.clip
    if (
      not _.isPlainObject(clip) or
      _.some(clip, (value) -> not _.isNumber(value)) or
      _.sortBy(_.keys(clip)).join(",") isnt "height,width,x,y"
    )
      $errUtils.throwErrByPath("screenshot.invalid_clip", {
        log: log
        args: { cmd: cmd, arg: $utils.stringify(clip) }
      })

    values.clip = clip

  if padding = props.padding
    isShorthandPadding = (value) -> (
      (_.isArray(value) and
        value.length >= 1 and
        value.length <= 4 and
        _.every(value, _.isFinite))
    )
    if not (_.isFinite(padding) or isShorthandPadding(padding))
      $errUtils.throwErrByPath("screenshot.invalid_padding", {
        log: log
        args: { cmd: cmd, arg: $utils.stringify(padding) }
      })

    values.padding = normalizePadding(padding)

  validateAndSetCallback(props, values, cmd, log, "onBeforeScreenshot")
  validateAndSetCallback(props, values, cmd, log, "onAfterScreenshot")

  return values

module.exports = {
  reset: ->
    ## for testing purposes
    defaults = reset()

  getConfig: ->
    _.cloneDeep(_.omit(defaults, "onBeforeScreenshot", "onAfterScreenshot"))

  onBeforeScreenshot: ($el) ->
    defaults.onBeforeScreenshot($el)

  onAfterScreenshot: ($el, results) ->
    defaults.onAfterScreenshot($el, results)

  defaults: (props) ->
    values = validate(props, "Cypress.Screenshot.defaults")
    _.extend(defaults, values)

  validate: validate
 }
