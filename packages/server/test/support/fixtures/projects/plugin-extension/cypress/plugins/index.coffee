path = require("path")

module.exports = (onFn, config) ->
  onFn "before:browser:launch", (browserName, args) ->
    pathToExt = path.resolve("ext")

    args.push("--load-extension=#{pathToExt}")
    args
