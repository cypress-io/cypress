const { $ } = Cypress

describe('src/cy/commands/actions/hover', () => {
  before(() => {
    cy
    .visit('/fixtures/dom.html')
    .then(function (win) {
      this.body = win.document.body.outerHTML
    })
  })

  beforeEach(function () {
    const doc = cy.state('document')

    $(doc.body).empty().html(this.body)
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
