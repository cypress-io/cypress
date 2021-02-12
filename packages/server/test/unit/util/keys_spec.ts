import { hide } from '../../../lib/util/keys'
import { expect } from 'chai'

describe('util/keys', () => {
  it('removes middle part of the string', () => {
    const hidden = hide('12345-xxxx-abcde')

    expect(hidden).to.equal('12345...abcde')
  })

  it('returns undefined for missing key', () => {
    expect(hide()).to.be.undefined
  })

  // https://github.com/cypress-io/cypress/issues/14571
  it('returns undefined for non-string argument', () => {
    expect(hide(true)).to.be.undefined
    expect(hide(1234)).to.be.undefined
  })
})
