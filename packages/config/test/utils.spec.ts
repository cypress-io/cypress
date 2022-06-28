import { expect } from 'chai'
import { hideKeys, checkIfResolveChangedRootFolder } from '../src/utils'

describe('hideKeys', () => {
  it('removes middle part of the string', () => {
    const hidden = hideKeys('12345-xxxx-abcde')

    expect(hidden).to.equal('12345...abcde')
  })

  it('returns undefined for missing key', () => {
    expect(hideKeys()).to.be.undefined
  })

  // https://github.com/cypress-io/cypress/issues/14571
  it('returns undefined for non-string argument', () => {
    expect(hideKeys(true)).to.be.undefined
    expect(hideKeys(1234)).to.be.undefined
  })
})

describe('checkIfResolveChangedRootFolder', () => {
  it('ignores non-absolute paths', () => {
    expect(checkIfResolveChangedRootFolder('foo/index.js', 'foo')).to.be.false
  })

  it('handles paths that do not switch', () => {
    expect(checkIfResolveChangedRootFolder('/foo/index.js', '/foo')).to.be.false
  })

  it('detects path switch', () => {
    expect(checkIfResolveChangedRootFolder('/private/foo/index.js', '/foo')).to.be.true
  })
})
