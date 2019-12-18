const snapshot = require('snap-shot-it')

/* eslint-env mocha */
describe('getJustVersion', () => {
  const { getJustVersion } = require('../utils')

  it('returns semver if passed', () => {
    snapshot(getJustVersion('0.20.1'))
  })

  it('returns semver with tag if passed', () => {
    snapshot(getJustVersion('1.0.0-dev'))
  })

  it('returns name if starts with cypress', () => {
    snapshot(getJustVersion('cypress@dev'))
    snapshot(getJustVersion('cypress@alpha'))
    snapshot(getJustVersion('cypress@0.20.3'))
  })

  it('returns name if matches cypress', () => {
    snapshot(getJustVersion('cypress'))
  })

  it('extracts version from url', () => {
    const url = 'https://foo.com/npm/0.20.3/develop-sha-13992/cypress.tgz'
    const version = getJustVersion(url)

    snapshot({ url, version })
  })

  it('extracts version with dev from url', () => {
    const url = 'https://foo.com/npm/0.20.3-dev/develop-sha-13992/cypress.tgz'
    const version = getJustVersion(url)

    snapshot({ url, version })
  })

  it('for anything else returns the input', () => {
    const url = 'babababa'
    const version = getJustVersion(url)

    snapshot({ url, version })
  })
})
