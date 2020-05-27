const urls = [
  'http://localhost:3434',
  'http://localhost:4545',
  'http://localhost:5656',
]

function incrState (key) {
  // console.log(key)
  cy.log(key)
  cy.task('incrState', key)
}

/**
 * BeforeEach should be rerun again after domain switch
 * Before will run again after domain switch on the first test to run of a suite
 * After hook will always run on last test of a suite
 */

// visit in sibling tests
describe('suite 1.0', () => {
  let local1 = null

  before(() => {
    local1 = true
    incrState('b1.0.1')
  })

  it('test 1.0.1', () => {
    incrState('t1.0.1')
    cy.visit(urls[0])
    .then(() => {
      expect(local1).eq(true)
    })
  })

  it('test 1.0.2', () => {
    expect(local1).eq(true)
    incrState('t1.0.2')
  })

  it('test 1.0.3', () => {
    incrState('t1.0.3')

    cy.visit(urls[1])
    .then(() => {
      expect(local1).eq(true)
    })
  })

  after(() => {
    incrState('a1.0.1')
  })
})

// visit in before hook
describe('suite 1.1', () => {
  before(() => {
    incrState('b1.1.1')
    cy.visit(urls[0])
  })

  before(() => {
    incrState('b1.1.2')
  })

  it('test 1.1.1', () => {
    incrState('t1.1.1')
  })

  it('test 1.1.2', () => {
    incrState('t1.1.2')
  })
})

// visit in beforeEach hook
describe('suite 1.2', () => {
  before(() => {
    incrState('b1.2.1')
  })

  beforeEach(() => {
    incrState('b1.2.2')
    cy.visit(urls[1])
  })

  beforeEach(() => {
    incrState('b1.2.3')
  })

  it('test 1.2.1', () => {
    incrState('t1.2.1')
  })

  it('test 1.2.2', () => {
    incrState('t1.2.2')
  })

  after(() => {
    incrState('a1.2.1')
  })
})

after(() => {
  cy.task('getState').then((state) => {
    expect(state).deep.eq({
      // visit in sibling tests
      'b1.0.1': 3,
      't1.0.1': 2,
      't1.0.2': 1,
      't1.0.3': 2,
      'a1.0.1': 1,

      // before visit
      'b1.1.1': 2,
      'b1.1.2': 1,
      't1.1.1': 1,
      't1.1.2': 1,

      // beforeEach visit
      'b1.2.1': 2,
      'b1.2.2': 3,
      'b1.2.3': 2,
      't1.2.1': 1,
      't1.2.2': 1,
      'a1.2.1': 1,

    })
  })
})
