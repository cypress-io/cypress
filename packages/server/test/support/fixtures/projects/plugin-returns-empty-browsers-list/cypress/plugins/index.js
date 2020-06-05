# returns invalid config - browsers list cannot be empty
module.exports = (onFn, config) ->
  {
    browsers: []
  }
