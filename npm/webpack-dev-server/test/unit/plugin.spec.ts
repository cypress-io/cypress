import { expect } from 'chai'
import { normalizeError } from '../../src/plugin'

describe('normalizeError', () => {
  it('normalizes Error to string', () => {
    const e = new Error('Bad')

    expect(normalizeError(e)).to.eq('Bad')
  })

  it('returns string as is', () => {
    expect(normalizeError('Bad')).to.eq('Bad')
  })
})
