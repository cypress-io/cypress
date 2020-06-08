import _ from 'lodash'
import minimatch from 'minimatch'
import { stripProtocolAndDefaultPorts } from './uri'

export function matches (urlToCheck, blocklistHosts) {
  // normalize into flat array
  blocklistHosts = [].concat(blocklistHosts)

  urlToCheck = stripProtocolAndDefaultPorts(urlToCheck)

  // use minimatch against the url
  // to see if any match
  const matchUrl = (hostMatcher) => {
    return minimatch(urlToCheck, hostMatcher)
  }

  return _.find(blocklistHosts, matchUrl)
}
