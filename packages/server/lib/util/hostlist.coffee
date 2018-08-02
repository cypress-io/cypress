_ = require("lodash")
minimatch = require("minimatch")
uri = require("./uri")

matches = (urlToCheck, listHosts) ->
  ## normalize into flat array
  listHosts = [].concat(listHosts)

  urlToCheck = uri.stripProtocolAndDefaultPorts(urlToCheck)

  matchUrl = (hostMatcher) ->
    ## use minimatch against the url
    ## to see if any match
    minimatch(urlToCheck, hostMatcher)

  _.find(listHosts, matchUrl)


module.exports = {
  matches
}
