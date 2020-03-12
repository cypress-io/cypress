# returns invalid config with a browser that is invalid
# (missing multiple properties)
module.exports = (onFn, config) ->
  {
    browsers: [{
      name: "browser name",
      family: "chromium"
    }]
  }
