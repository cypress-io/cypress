describe('suite and test override values persist through the full hook lifecycle', { expose: { describe: 'describe expose' } }, () => {
  before(() => {
    expect(Cypress.expose('describe')).to.eq('describe expose')
    Cypress.expose('describe', 'before')
    expect(Cypress.expose('it')).to.eq('it')
  })

  beforeEach(() => {
    expect(Cypress.expose('describe')).to.eq('before')
    Cypress.expose('describe', 'beforeEach')
    expect(Cypress.expose('it')).to.eq('it')
  })

  afterEach(() => {
    expect(Cypress.expose('describe')).to.eq('beforeEach')
    Cypress.expose('describe', 'afterEach')
  })

  after(() => {
    expect(Cypress.expose('describe')).to.eq('afterEach')
  })

  it('test-level key merges with suite-level key and hook mutations carry forward', { expose: { it: 'it' } }, () => {
    expect(Cypress.expose('describe')).to.eq('beforeEach')
    expect(Cypress.expose('it')).to.eq('it')
  })
})
