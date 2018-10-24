_ = require("lodash")
minimatch = require("minimatch")
uri = require("./uri")

matches = (urlToCheck, blacklistHosts) ->
  ## normalize into flat array
  blacklistHosts = [].concat(blacklistHosts)

  urlToCheck = uri.stripProtocolAndDefaultPorts(urlToCheck)

  matchUrl = (hostMatcher) ->
    ## use minimatch against the url
    ## to see if any match
    minimatch(urlToCheck, hostMatcher)

  _.find(blacklistHosts, matchUrl)


module.exports = {
  matches
}
