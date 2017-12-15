_ = require("lodash")
url = require("url")
minimatch = require("minimatch")

DEFAULT_PORTS = ["443", "80"]

stripProtocolAndDefaultPorts = (urlToCheck) ->
  ## grab host which is 'hostname:port' only
  { host, hostname, port } = url.parse(urlToCheck)

  ## if we have a default port for 80 or 443
  ## then just return the hostname
  if port in DEFAULT_PORTS
    return hostname

  ## else return the host
  return host

matches = (urlToCheck, blacklistHosts) ->
  ## normalize into flat array
  blacklistHosts = [].concat(blacklistHosts)

  urlToCheck = stripProtocolAndDefaultPorts(urlToCheck)

  matchUrl = (hostMatcher) ->
    ## use minimatch against the url
    ## to see if any match
    minimatch(urlToCheck, hostMatcher)

  _.find(blacklistHosts, matchUrl)


module.exports = {
  matches

  stripProtocolAndDefaultPorts
}
