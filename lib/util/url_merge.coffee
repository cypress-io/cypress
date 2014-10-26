_   = require("lodash")
Url = require("url")

module.exports = (origin, redirect) ->
  originUrl = Url.parse(origin)
  redirectUrl = Url.parse(redirect)

  _.each redirectUrl, (value, key) ->
    if not value?
      redirectUrl[key] = originUrl[key]

  redirectUrl.format()