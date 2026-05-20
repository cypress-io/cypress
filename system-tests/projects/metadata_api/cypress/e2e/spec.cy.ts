describe('metadata API', { metadata: { describe: 'describe metadata' } }, () => {
  before(() => {
    expect(Cypress.metadata.get('describe')).to.eq('describe metadata')
    Cypress.metadata.set('describe', 'before')
    expect(Cypress.metadata.get('it')).to.eq('it')
  })

  beforeEach(() => {
    expect(Cypress.metadata.get('describe')).to.eq('before')
    Cypress.metadata.set('describe', 'beforeEach')
    expect(Cypress.metadata.get('it')).to.eq('it')
  })

  afterEach(() => {
    expect(Cypress.metadata.get('describe')).to.eq('beforeEach')
    Cypress.metadata.set('describe', 'afterEach')
  })

  after(() => {
    expect(Cypress.metadata.get('describe')).to.eq('afterEach')
  })

  it('allows for persisted metadata across a given spec given suite, hooks, and test config overrides', { metadata: { it: 'it' } }, () => {
    expect(Cypress.metadata.get('describe')).to.eq('beforeEach')
    expect(Cypress.metadata.get('it')).to.eq('it')
  })
})
