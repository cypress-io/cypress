import _ from 'lodash'
import { $Location } from '../cypress/location'

export const bothUrlsMatchAndOneHasHash = (current, remote, eitherShouldHaveHash: boolean = false): boolean => {
  // the current has a hash or the last char of href is a hash
  const currentHasHash = current.hash || current.href.slice(-1) === '#'
  // the remote has a hash or the last char of href is a hash
  const remoteHasHash = remote.hash || remote.href.slice(-1) === '#'

  const urlHasHash = eitherShouldHaveHash ? (remoteHasHash || currentHasHash) : remoteHasHash

  return urlHasHash &&
  // both must have the same origin
  current.origin === remote.origin &&
    // both must have the same pathname
    current.pathname === remote.pathname &&
      // both must have the same query params
      current.search === remote.search
}

export const historyNavigationTriggeredHashChange = (state): boolean => {
  const delta = state('navHistoryDelta') || 0

  if (delta === 0 || delta == null) { // page refresh
    return false
  }

  const urls = state('urls')
  const urlPosition = state('urlPosition')

  if (_.isEmpty(urls) || urlPosition === undefined) {
    return false
  }

  const currentUrl = $Location.create(urls[urlPosition])

  const nextPosition = urlPosition + delta
  const nextUrl = $Location.create(urls[nextPosition])

  return bothUrlsMatchAndOneHasHash(currentUrl, nextUrl, true)
}

// Predicts whether navigating the browser history by `delta` will land on a
// different (super domain) origin. We can only compare against the history
// entries Cypress observed during the test, so when the destination is unknown
// we report `false` and fall back to the existing behavior.
export const historyNavigationChangesSuperDomainOrigin = (Cypress, state, delta: number): boolean => {
  if (!delta) {
    return false
  }

  const urls = state('urls')
  const urlPosition = state('urlPosition')

  if (_.isEmpty(urls) || urlPosition === undefined) {
    return false
  }

  const currentUrl = urls[urlPosition]
  const nextUrl = urls[urlPosition + delta]

  if (!currentUrl || !nextUrl) {
    return false
  }

  const current = $Location.create(currentUrl)
  const next = $Location.create(nextUrl)

  const originFor = (location) => Cypress.config('injectDocumentDomain') ? location.superDomainOrigin : location.origin

  return originFor(current) !== originFor(next)
}
