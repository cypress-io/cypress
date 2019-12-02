import _ from 'lodash'
import minimatch from 'minimatch'
import { stripProtocolAndDefaultPorts } from './uri'

export function matches (urlToCheck, blacklistHosts) {
  // normalize into flat array
  blacklistHosts = [].concat(blacklistHosts)

  urlToCheck = stripProtocolAndDefaultPorts(urlToCheck)

  // use minimatch against the url
  // to see if any match
  const matchUrl = (hostMatcher) => {
    return minimatch(urlToCheck, hostMatcher)
  }

  return _.find(blacklistHosts, matchUrl)
}
