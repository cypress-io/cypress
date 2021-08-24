const helpers = require('../../support/helpers')

const { createCypress } = helpers
const { runIsolatedCypress } = createCypress()

// https://github.com/cypress-io/cypress/issues/17542
describe('issue 17542', () => {
  let spy

  beforeEach(function () {
    return runIsolatedCypress(`cypress/fixtures/issues/issue-17542.js`)
    .then(() => {
      cy.window().then((win) => {
        win.console.log.restore()
        spy = cy.spy(win.console, 'log')
      })
    })
  })

  afterEach(function () {
    cy.window().then(() => {
      spy.restore()
    })
  })

  it('cy.log() shows all arguments in each line when there are multiple args', function () {
    cy.get('li.command').click().then(() => {
      expect(spy).to.have.been.calledWith(`%cArgs:`, 'font-weight: bold')
      expect(spy).to.have.been.calledWith(`%c  [0]:`, 'font-weight: bold', 1)
      expect(spy).to.have.been.calledWith(`%c  [1]:`, 'font-weight: bold', 2)
      expect(spy).to.have.been.calledWith(`%c  [2]:`, 'font-weight: bold', 3)
    })
  })
})
