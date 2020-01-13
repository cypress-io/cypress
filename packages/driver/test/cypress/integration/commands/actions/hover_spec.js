const $ = Cypress.$.bind(Cypress)

describe('src/cy/commands/actions/hover', function () {
  before(() => {
    return cy
    .visit('/fixtures/dom.html')
    .then(function (win) {
      this.body = win.document.body.outerHTML
    })
  })

  beforeEach(function () {
    const doc = cy.state('document')

    $(doc.body).empty().html(this.body)
  })

  context('#hover', function () {
    it('throws when invoking', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('cy.hover() is not currently implemented.')
        expect(err.message).to.include('https://on.cypress.io/hover')

        return done()
      })

      cy.get('button').hover()
    })
  })
})
