import { expect } from 'chai'
import { hideKeys } from '../src/utils'

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
