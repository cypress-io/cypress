describe('Cypress.metadata.clear() resets entries mid-test and suite override is reapplied for subsequent tests', { metadata: { describe: 'describe metadata' } }, () => {
  describe('clear() empties the map and is visible in afterEach and after hooks', () => {
    before(() => {
      expect(Cypress.metadata.get('describe')).to.eq('describe metadata')
      Cypress.metadata.set('describe', 'before')
      expect(Cypress.metadata.get('it')).to.eq('it2')
    })

    beforeEach(() => {
      expect(Cypress.metadata.get('describe')).to.eq('before')
      Cypress.metadata.set('describe', 'beforeEach')
      expect(Cypress.metadata.get('it')).to.eq('it2')
    })

    afterEach(() => {
      expect(Cypress.metadata.get('describe')).to.eq(undefined)
      expect(Cypress.metadata.get('it')).to.eq(undefined)
    })

    after(() => {
      expect(Cypress.metadata.get('describe')).to.eq(undefined)
      expect(Cypress.metadata.get('it')).to.eq(undefined)
    })

    it('calling clear() mid-test empties the map; afterEach and after see no entries', { metadata: { it: 'it2' } }, () => {
      expect(Cypress.metadata.get('describe')).to.eq('beforeEach')
      expect(Cypress.metadata.get('it')).to.eq('it2')
      Cypress.metadata.clear()
    })
  })

  it('suite override is reapplied for a subsequent test after a sibling test called clear()', { metadata: { it: 'it2' } }, () => {
    expect(Cypress.metadata.get('describe')).to.eq('describe metadata')
    expect(Cypress.metadata.get('it')).to.eq('it2')
  })
})
