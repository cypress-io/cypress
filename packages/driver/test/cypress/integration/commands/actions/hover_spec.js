/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress)
const {
  _,
} = Cypress

describe('src/cy/commands/actions/hover', () => {
  before(() => {
    cy
    .visit('/fixtures/dom.html')
    .then(function (win) {
      this.body = win.document.body.outerHTML
    })
  })

  beforeEach(() => {
    const doc = cy.state('document')

    return $(doc.body).empty().html(this.body)
  })

  context('#hover', () => {
    it('throws when invoking', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.hover()` is not currently implemented.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/hover')

        done()
      })

      cy.get('button').hover()
    })
  })
})
