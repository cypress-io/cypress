path = require("path")

module.exports = (onFn, config) ->
  onFn "before:browser:launch", (browser = {}, options) ->
    pathToExt = path.resolve("ext")

    options.args.push("--load-extension=#{pathToExt}")
    options
