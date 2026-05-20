describe('metadata API', { metadata: { describe: 'describe metadata' } }, () => {
  describe('inner hook testing', () => {
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

    it('allows mutation / editing / clearing of metadata at any given point in the test', { metadata: { it: 'it2' } }, () => {
      expect(Cypress.metadata.get('describe')).to.eq('beforeEach')
      expect(Cypress.metadata.get('it')).to.eq('it2')
      Cypress.metadata.clear()
    })
  })

  it('resets metadata to the original / overridden values pre test config overrides', { metadata: { it: 'it2' } }, () => {
    expect(Cypress.metadata.get('describe')).to.eq('describe metadata')
    expect(Cypress.metadata.get('it')).to.eq('it2')
  })
})
