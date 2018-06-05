_ = require("lodash")

$utils = require("./utils")

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
    if not (capture in validCaptures)
      $utils.throwErrByPath("screenshot.invalid_capture", {
        log: log
        args: { cmd: cmd, arg: $utils.stringify(capture) }
      })

    values.capture = capture

  validateAndSetBoolean(props, values, cmd, log, "scale")
  validateAndSetBoolean(props, values, cmd, log, "disableTimersAndAnimations")
  validateAndSetBoolean(props, values, cmd, log, "screenshotOnRunFailure")

  if blackout = props.blackout
    if not _.isArray(blackout) or _.some(blackout, (selector) -> not _.isString(selector))
      $utils.throwErrByPath("screenshot.invalid_blackout", {
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
      $utils.throwErrByPath("screenshot.invalid_clip", {
        log: log
        args: { cmd: cmd, arg: $utils.stringify(clip) }
      })

    values.clip = clip

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
