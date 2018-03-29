_ = require("lodash")

$utils = require("./utils")

reset = -> {
  capture: ["runner"]
  waitForCommandSynchronization: true
  scaleAppCaptures: false
  disableTimersAndAnimations: true
  screenshotOnRunFailure: true
  blackout: []
  beforeScreenshot: ->
  afterScreenshot: ->
}

defaults = reset()

validCaptures = ["app", "runner", "app,runner"]

isCaptureValid = (capture) ->
  if not _.isArray(capture)
    return false

  ## can't be any empty array
  if not capture.length
    return false

  ## must be valid strings in valid order
  if not (capture.join(",") in validCaptures)
    return false

  ## can't be duplicates
  if _.uniq(capture).length isnt capture.length
    return false

  return true

validateAndSetBoolean = (props, values, cmd, log, option) ->
  value = props[option]
  if not value?
    return

  if not _.isBoolean(value)
    $utils.throwErrByPath("screenshot.invalid_boolean", {
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
    $utils.throwErrByPath("screenshot.invalid_callback", {
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

  validateAndSetBoolean(props, values, cmd, log, "waitForCommandSynchronization")
  validateAndSetBoolean(props, values, cmd, log, "scaleAppCaptures")
  validateAndSetBoolean(props, values, cmd, log, "disableTimersAndAnimations")
  validateAndSetBoolean(props, values, cmd, log, "screenshotOnRunFailure")

  if blackout = props.blackout
    if not _.isArray(blackout) or _.some(blackout, (selector) -> not _.isString(selector))
      $utils.throwErrByPath("screenshot.invalid_blackout", {
        log: log
        args: { cmd: cmd, arg: $utils.stringify(blackout) }
      })

    values.blackout = blackout

  validateAndSetCallback(props, values, cmd, log, "beforeScreenshot")
  validateAndSetCallback(props, values, cmd, log, "afterScreenshot")

  return values

module.exports = {
  reset: ->
    ## for testing purposes
    defaults = reset()

  getConfig: ->
    _.omit(defaults, "beforeScreenshot", "afterScreenshot")

  callBeforeScreenshot: (doc) ->
    defaults.beforeScreenshot(doc)

  callAfterScreenshot: (doc) ->
    defaults.afterScreenshot(doc)

  defaults: (props) ->
    values = validate(props, "Cypress.Screenshot.defaults")
    _.extend(defaults, values)

  validate: validate
 }

