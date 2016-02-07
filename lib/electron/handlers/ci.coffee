os       = require("os")
Promise  = require("bluebird")
errors   = require("./errors")
headless = require("./headless")

module.exports = {
  ensureCi: ->
    Promise.try =>
      ## TODO: this method is going to change. we'll soon by
      ## removing CI restrictions once we're spinning up instances
      return if os.platform() is "linux"

      errors.throw("NOT_CI_ENVIRONMENT")

  run: (app, options) ->
    @ensureCi()
}