debug = require('debug')('cypress:server:cypress')

module.exports = (mode, options) ->
  debug("mode is", mode)
  switch mode
    when "record"
      require("./record").run(options)
    when "headless"
      require("./headless").run(options)
    when "headed"
      require("./headed").run(options)
