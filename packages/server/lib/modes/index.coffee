debug = require('debug')('cypress:server:cypress')

module.exports = (mode, options) ->
  debug("mode is", mode)
  switch mode
    when "record"
      require("./record").run(options)
    when "run"
      require("./run").run(options)
    when "interactive"
      require("./interactive").run(options)
