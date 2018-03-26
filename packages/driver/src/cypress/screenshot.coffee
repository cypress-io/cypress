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

validateAndSetBoolean = (props, values, cmd, log, option, errorKey) ->
  value = props[option]
  if value?
    if not _.isBoolean(value)
      $utils.throwErrByPath("screenshot.#{errorKey}", {
        log: log
        args: { cmd: cmd, arg: $utils.stringify(value) }
      })

    values[option] = value

validate = (props, cmd, log) ->
  values = {}

  if not _.isPlainObject(props)
    $utils.throwErrByPath("screenshot.invalid_arg", {
      log: log
      args: { cmd: cmd, arg: $utils.stringify(props) }
    })

  if capture = props.capture
    if not isCaptureValid(capture)
      $utils.throwErrByPath("screenshot.invalid_capture", {
        log: log
        args: { cmd: cmd, arg: $utils.stringify(capture) }
      })

    values.capture = capture

  validateAndSetBoolean(props, values, cmd, log, "waitForCommandSynchronization", "invalid_wait_for_sync")
  validateAndSetBoolean(props, values, cmd, log, "scaleAppCaptures", "invalid_scale_captures")
  validateAndSetBoolean(props, values, cmd, log, "disableTimersAndAnimations", "invalid_disable_animations")
  validateAndSetBoolean(props, values, cmd, log, "screenshotOnRunFailure", "invalid_screenshot_on_failure")

  if blackout = props.blackout
    if not _.isArray(blackout) or _.some(blackout, (selector) -> not _.isString(selector))
      $utils.throwErrByPath("screenshot.invalid_blackout", {
        log: log
        args: { cmd: cmd, arg: $utils.stringify(blackout) }
      })

    values.blackout = blackout

  if onScreenshot = props.onScreenshot
    if not _.isFunction(onScreenshot)
      $utils.throwErrByPath("screenshot.invalid_on_screenshot", {
        log: log
        args: { cmd: cmd, arg: $utils.stringify(onScreenshot) }
      })

    values.onScreenshot = onScreenshot

  return values

module.exports = {
  reset: ->
    ## for testing purposes
    defaults = reset()

  getConfig: ->
    _.omit(defaults, "onScreenshot")

  getOnScreenshot: ->
    defaults.onScreenshot

  defaults: (props) ->
    values = validate(props, "Cypress.Screenshot.defaults")
    _.extend(defaults, values)

  validate: validate
 }

