const _ = require('lodash')
const minimatch = require('minimatch')
const uri = require('./uri')

const matches = function (urlToCheck, blacklistHosts) {
  //# normalize into flat array
  blacklistHosts = [].concat(blacklistHosts)

  urlToCheck = uri.stripProtocolAndDefaultPorts(urlToCheck)

  // use minimatch against the url
  // to see if any match
  const matchUrl = (hostMatcher) => {
    return minimatch(urlToCheck, hostMatcher)
  }

  return _.find(blacklistHosts, matchUrl)
}

module.exports = {
  matches,
}
