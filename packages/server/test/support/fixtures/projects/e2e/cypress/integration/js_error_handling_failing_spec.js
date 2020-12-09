/* eslint-disable
    brace-style,
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('s1', () => {
  context('without an afterEach hook', () => {
    beforeEach(() => {
      return cy
      .server()
      .visit('/js_errors.html')
      .get('body')
    })

    // fail
    it('t1', () => {
      return cy
      .get('.ref')
      .click()
      .should('have.class', 'active')
    })

    // fail
    it('t2', () => {
      return cy
      .route(/foo/, 'foo html').as('getFoo')
      .get('.xhr').click()
      .wait('@getFoo')
      .get('.xhr').should('have.class', 'active')
    })

    // pass
    it('t3', () => {
      return cy.get('body')
    })
  })

  context('with an afterEach hook', () => {
    const runs = []

    beforeEach(() => {
      return cy
      .server()
      .visit('/js_errors.html')
      .get('body')
    })

    afterEach(() => {
      return cy.wrap({}).then(() => {
        return runs.push(true)
      })
    })

    // fail
    it('t4', () => {
      return cy
      .get('.ref')
      .click()
      .should('have.class', 'active')
    })

    // fail
    it('t5', () => {
      return cy.then(() => {
        throw new Error('baz')
      })
    })

    // pass
    it('t6', () => // should have runs two afterEach's
    {
      expect(runs).to.have.length(2)
    })
  })

  context('cross origin script errors', () => // fail
  {
    it('explains where script errored', () => {
      return cy
      .visit('/cross_origin_script.html')
      .then(() => {
        throw new Error('should have failed but did not')
      })
    })
  })

  context('bad gzipped content', () => {
    it('destroys the request socket', () => {
      return cy
      .visit('http://localhost:1123/index.html')
      .then((win) => {
        return new Cypress.Promise((resolve) => {
          const script = win.document.createElement('script')

          script.src = '/gzip-bad.js'
          script.onerror = resolve

          return win.document.body.appendChild(script)
        })
      })
    })
  })
})
