describe('suite and test override values persist through the full hook lifecycle', { metadata: { describe: 'describe metadata' } }, () => {
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

  it('test-level key merges with suite-level key and hook mutations carry forward', { metadata: { it: 'it' } }, () => {
    expect(Cypress.metadata.get('describe')).to.eq('beforeEach')
    expect(Cypress.metadata.get('it')).to.eq('it')
  })
})
