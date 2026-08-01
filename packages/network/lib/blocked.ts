import _ from 'lodash'
import picomatch from 'picomatch'
import { stripProtocolAndDefaultPorts } from '@packages/network-tools'

export function matches (urlToCheck: string, blockHosts: string[] | string) {
  // normalize into flat array
  const blockHostsNormalized: string[] = ([] as string[]).concat(blockHosts)

  const urlToCheckStripped = stripProtocolAndDefaultPorts(urlToCheck) as string

  // glob-match the stripped host against each block host to see if any match.
  // picomatch throws on an empty pattern, which an empty block host never needs
  // to match against anyway, so treat it as a non-match.
  const matchUrl = (hostMatcher: string) => {
    return hostMatcher !== '' && picomatch.isMatch(urlToCheckStripped, hostMatcher)
  }

  return _.find(blockHostsNormalized, matchUrl)
}
