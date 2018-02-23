_ = require("lodash")
$utils = require("./utils")

defaults = {}

module.exports = ->
  return {
    defaults: (props) ->
      if not _.isPlainObject(props)
        $utils.throwErrByPath("selector_playground.defaults_invalid_arg", {
          args: { arg: $utils.stringify(props) }
        })

      if priority = props.selectorPriority
        if not _.isArray(priority)
          $utils.throwErrByPath("selector_playground.defaults_invalid_priority", {
            args: { arg: $utils.stringify(priority) }
          })

        defaults.selectorPriority = priority

      if onElement = props.onElement
        if not _.isFunction(onElement)
          $utils.throwErrByPath("selector_playground.defaults_invalid_on_element", {
            args: { arg: $utils.stringify(onElement) }
          })

        defaults.onElement = onElement

    ## these methods are used internally by the runner and for testing
    _selectorPriority: ->
      defaults.selectorPriority

    _onElement: ->
      defaults.onElement

  }
