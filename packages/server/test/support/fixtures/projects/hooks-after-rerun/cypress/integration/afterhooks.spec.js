const urls = [
  'http://localhost:3434',
  'http://localhost:4545',
  // 'http://localhost:3500/fixtures/generic.html',
  // 'http://localhost:3501/fixtures/generic.html',
]

describe('suite 1', () => {
  let local1 = null

  before(() => {
    local1 = true
    cy.task('incrState', 'b1')
  })

  it('test 1', () => {
    expect(local1, 'should maintain local state in beforehook after navigation ONLY IF first test in suite').eq(true)
    cy.task('incrState', 't1')
    cy.visit(urls[0])
  })

  it('test 2', () => {
    expect(local1).eq(true)
    cy.task('incrState', 't2')
  })

  it('test 3', () => {
    cy.visit(urls[1])
    .then(() => {
      expect(local1, 'null since since localstate not maintained').eq(null)
    })
  })

  it('test 4', () => {
    // switch domain back for next tests
    cy.visit(urls[0])
  })

  after(() => {
    cy.task('incrState', 'a1')
  })
})

describe('suite 2', () => {
  it('s2t1', () => {
    cy.task('incrState', 's2t1')
    cy.visit(urls[1])
  })
})

describe('suite 3', () => {
  before(() => {
    cy.task('incrState', 's3b1')
    cy.visit(urls[0])
  })

  before(() => {
    cy.window().then((win) => {
      win.__local2 = true
    })
  })

  it('s3t1', () => {
    cy.task('incrState', 's3t1')
    cy.window().its('__local2').should('eq', true)
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
      's3b1': 2,
      's3t1': 1,
      'a2': 1,
    })
  })
})
