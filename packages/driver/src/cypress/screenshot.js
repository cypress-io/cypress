const _ = require('lodash')

const $utils = require('./utils')
const $errUtils = require('./error_utils')

const reset = () => {
  return {
    capture: 'fullPage',
    scale: false,
    disableTimersAndAnimations: true,
    screenshotOnRunFailure: true,
    blackout: [],
    onBeforeScreenshot () {},
    onAfterScreenshot () {},
  }
}

let defaults = reset()

const validCaptures = ['fullPage', 'viewport', 'runner']

const normalizePadding = function (padding) {
  let bottom; let left; let right; let top

  if (!padding) {
    padding = 0
  }

  if (_.isArray(padding)) {
    // CSS shorthand
    // See: https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties#Tricky_edge_cases
    switch (padding.length) {
      case 1:
        top = (right = (bottom = (left = padding[0])))
        break
      case 2:
        top = (bottom = padding[0])
        right = (left = padding[1])
        break
      case 3:
        top = padding[0]
        right = (left = padding[1])
        bottom = padding[2]
        break
      case 4:
        top = padding[0]
        right = padding[1]
        bottom = padding[2]
        left = padding[3]
        break
      default: null
    }
  } else {
    top = (right = (bottom = (left = padding)))
  }

  return [
    top,
    right,
    bottom,
    left,
  ]
}

const validateAndSetBoolean = function (props, values, cmd, log, option) {
  const value = props[option]

  if ((value == null)) {
    return
  }

  if (!_.isBoolean(value)) {
    $errUtils.throwErrByPath('screenshot.invalid_boolean', {
      log,
      args: {
        cmd,
        option,
        arg: $utils.stringify(value),
      },
    })
  }

  values[option] = value
}

const validateAndSetCallback = function (props, values, cmd, log, option) {
  const value = props[option]

  if ((value == null)) {
    return
  }

  if (!_.isFunction(value)) {
    $errUtils.throwErrByPath('screenshot.invalid_callback', {
      log,
      args: {
        cmd,
        callback: option,
        arg: $utils.stringify(value),
      },
    })
  }

  values[option] = value
}

const validate = function (props, cmd, log) {
  const values = {}

  if (!_.isPlainObject(props)) {
    $errUtils.throwErrByPath('screenshot.invalid_arg', {
      log,
      args: { cmd, arg: $utils.stringify(props) },
    })
  }

  const capture = props.capture

  if (capture) {
    if (!(validCaptures.includes(capture))) {
      $errUtils.throwErrByPath('screenshot.invalid_capture', {
        log,
        args: { cmd, arg: $utils.stringify(capture) },
      })
    }

    values.capture = capture
  }

  validateAndSetBoolean(props, values, cmd, log, 'scale')
  validateAndSetBoolean(props, values, cmd, log, 'disableTimersAndAnimations')
  validateAndSetBoolean(props, values, cmd, log, 'screenshotOnRunFailure')

  const blackout = props.blackout

  if (blackout) {
    if (!_.isArray(blackout) || _.some(blackout, (selector) => !_.isString(selector))) {
      $errUtils.throwErrByPath('screenshot.invalid_blackout', {
        log,
        args: { cmd, arg: $utils.stringify(blackout) },
      })
    }

    values.blackout = blackout
  }

  const clip = props.clip

  if (clip) {
    if (
      !_.isPlainObject(clip) ||
      _.some(clip, (value) => !_.isNumber(value)) ||
      (_.sortBy(_.keys(clip)).join(',') !== 'height,width,x,y')
    ) {
      $errUtils.throwErrByPath('screenshot.invalid_clip', {
        log,
        args: { cmd, arg: $utils.stringify(clip) },
      })
    }

    values.clip = clip
  }

  const padding = props.padding

  if (padding) {
    const isShorthandPadding = (value) => {
      return _.isArray(value) &&
        (value.length >= 1) &&
        (value.length <= 4) &&
        _.every(value, _.isFinite)
    }

    if (!(_.isFinite(padding) || isShorthandPadding(padding))) {
      $errUtils.throwErrByPath('screenshot.invalid_padding', {
        log,
        args: { cmd, arg: $utils.stringify(padding) },
      })
    }

    values.padding = normalizePadding(padding)
  }

  validateAndSetCallback(props, values, cmd, log, 'onBeforeScreenshot')
  validateAndSetCallback(props, values, cmd, log, 'onAfterScreenshot')

  return values
}

module.exports = {
  reset () {
    defaults = reset()
  },

  getConfig () {
    return _.cloneDeep(_.omit(defaults, 'onBeforeScreenshot', 'onAfterScreenshot'))
  },

  onBeforeScreenshot ($el) {
    return defaults.onBeforeScreenshot($el)
  },

  onAfterScreenshot ($el, results) {
    return defaults.onAfterScreenshot($el, results)
  },

  defaults (props) {
    const values = validate(props, 'Cypress.Screenshot.defaults')

    return _.extend(defaults, values)
  },

  validate,
}
