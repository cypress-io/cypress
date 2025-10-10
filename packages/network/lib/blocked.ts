import _ from 'lodash'
import minimatch from 'minimatch'
import { stripProtocolAndDefaultPorts } from '@packages/network-tools'

export function matches (urlToCheck: string, blockHosts: string[] | string) {
  // normalize into flat array
  const blockHostsNormalized: string[] = ([] as string[]).concat(blockHosts)

  const urlToCheckStripped = stripProtocolAndDefaultPorts(urlToCheck) as string

  // use minimatch against the url
  // to see if any match
  const matchUrl = (hostMatcher: string) => {
    return minimatch(urlToCheckStripped, hostMatcher)
  }

  return _.find(blockHostsNormalized, matchUrl)
}
