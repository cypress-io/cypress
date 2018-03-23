_ = require("lodash")

$utils = require("./utils")

reset = -> {
  capture: ["all"]
  waitForCommandSynchronization: true
  scaleAppCaptures: false
  disableTimersAndAnimations: true
  screenshotOnRunFailure: true
  blackout: []
  onScreenshot: ->
}

defaults = reset()

validCaptures = ["app", "all"]

isCaptureValid = (capture) ->
  if not _.isArray(capture)
    return false

  ## can't be any empty array
  if not capture.length
    return false

  ## must be valid strings
  if _.some(capture, (item) -> not (item in validCaptures))
    return false

  ## can't be duplicates
  if _.uniq(capture).length isnt capture.length
    return false

  return true

validateAndSetBoolean = (props, option, errorKey) ->
  value = props[option]
  if value?
    if not _.isBoolean(value)
      $utils.throwErrByPath("screenshot.defaults.#{errorKey}", {
        args: { arg: $utils.stringify(value) }
      })

    defaults[option] = value

module.exports = {
  reset: ->
    ## for testing purposes
    defaults = reset()

  getConfig: ->
    _.omit(defaults, "onScreenshot")

  getOnScreenshot: ->
    defaults.onScreenshot

  defaults: (props) ->
    if not _.isPlainObject(props)
      $utils.throwErrByPath("screenshot.defaults.invalid_arg", {
        args: { arg: $utils.stringify(props) }
      })

    if capture = props.capture
      if not isCaptureValid(capture)
        $utils.throwErrByPath("screenshot.defaults.invalid_capture", {
          args: { arg: $utils.stringify(capture) }
        })

      defaults.capture = capture

    validateAndSetBoolean(props, "waitForCommandSynchronization", "invalid_wait_for_sync")
    validateAndSetBoolean(props, "scaleAppCaptures", "invalid_scale_captures")
    validateAndSetBoolean(props, "disableTimersAndAnimations", "invalid_disable_animations")
    validateAndSetBoolean(props, "screenshotOnRunFailure", "invalid_screenshot_on_failure")

    if blackout = props.blackout
      if not _.isArray(blackout) or _.some(blackout, (selector) -> not _.isString(selector))
        $utils.throwErrByPath("screenshot.defaults.invalid_blackout", {
          args: { arg: $utils.stringify(blackout) }
        })

      defaults.blackout = blackout

    if onScreenshot = props.onScreenshot
      if not _.isFunction(onScreenshot)
        $utils.throwErrByPath("screenshot.defaults.invalid_on_screenshot", {
          args: { arg: $utils.stringify(onScreenshot) }
        })

      defaults.onScreenshot = onScreenshot
}
