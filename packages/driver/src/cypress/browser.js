_ = require("lodash")
$utils = require("./utils")

isBrowser = (config, obj='') ->
  if _.isString(obj)
    name = obj.toLowerCase()
    currentName = config.browser.name.toLowerCase()

    return name == currentName

  if _.isObject(obj)
    return _.isMatch(config.browser, obj)

  $utils.throwErrByPath("browser.invalid_arg", {
    args: { method: 'isBrowser', obj: $utils.stringify(obj) }
  })

module.exports = (config) ->
  {
    browser: config.browser
    isBrowser: _.partial(isBrowser, config)
  }
