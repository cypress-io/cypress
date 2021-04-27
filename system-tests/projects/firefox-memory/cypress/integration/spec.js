const NUM_TESTS = Cypress.env('NUM_TESTS') || 100

let lastSample = parse(window.performance.memory)
const samples = []

Cypress.on('test:after:run', (attrs) => {
  if (window.gc) {
    // window.gc()
    lastSample = parse(window.performance.memory)
    samples.push(lastSample)
  }
})

function parse (obj) {
  if (!obj) {
    return
  }

  const str = JSON.stringify(obj, [
    'usedJSHeapSize',
    'totalJSHeapSize',

    'jsHeapSizeLimit',
  ])

  return JSON.parse(str)
}
const stats = () => {
  const { firefoxGcInterval, firefoxGcInOpenMode } = Cypress.config()

  cy.task('console', {
    firefoxGcInterval,
    firefoxGcInOpenMode,
    numTests: NUM_TESTS,
  })
}

describe('memory leak finder', function () {
  let duration

  beforeEach(() => {
    cy.task('log:memory')
  })

  before(stats)
  before(() => {
    duration = Date.now()

    if (Cypress.platform === 'linux') {
      cy.task('capture:memory')
    }
  })

  after(stats)
  after(() => {
    duration = Date.now() - duration

    cy
    .task('stop:capture:memory')
    .then(() => {
      return Cypress.backend('log:memory:pressure')
    })
    .task('console', { duration })
  })

  beforeEach(() => {
    lastSample && cy.task('console', lastSample)
    // // cy.wait(50000)
    // cy.server()
    // cy.route('/logout', {})
    // cy.fixture('current-user').as('currentUser')
  })

  describe('Login', function () {
    context('social login buttons', function () {
      Cypress._.times(NUM_TESTS, (n) => {
        it(`test #${n + 1}: displays login button on route visit`, function () {
          cy.visit('https://dashboard.cypress.io/login')
          cy.contains('Log In with GitHub')
          // cy.wait(2000)
        })
      })
    })
  })
})
