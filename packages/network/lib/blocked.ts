import _ from 'lodash'
import minimatch from 'minimatch'
import { stripProtocolAndDefaultPorts } from './uri'

export function matches (urlToCheck, blockHosts) {
  // normalize into flat array
  blockHosts = [].concat(blockHosts)

  urlToCheck = stripProtocolAndDefaultPorts(urlToCheck)

  // use minimatch against the url
  // to see if any match
  const matchUrl = (hostMatcher) => {
    return minimatch(urlToCheck, hostMatcher)
  }

  return _.find(blockHosts, matchUrl)
}
