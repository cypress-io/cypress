describe('suite 1', () => {
  before(() => {
    cy.task('incrState', 'b1')
  })

  it('test 1', () => {
    cy.task('incrState', 't1')
    cy.visit('http://localhost:3434')
  })

  it('test 2', () => {
    cy.task('incrState', 't2')
  })

  after(() => {
    cy.task('incrState', 'a1')
  })
})

describe('suite 2', () => {
  it('s2t1', () => {
    cy.task('incrState', 's2t1')
    cy.visit('http://localhost:4545')
  })
})

after(() => {
  cy.task('incrState', 'a2')
  cy.task('getState').then((state) => {
    expect(state).deep.eq({
      // initial domain change causes 2 runs
      'b1': 2,
      't1': 2,
      't2': 1,
      'a1': 1,
      // domain change causes 2 runs
      's2t1': 2,
      'a2': 1,
    })
  })
})
