const { $ } = Cypress

describe('src/cy/commands/actions/mount', () => {
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

  context('#mount', () => {
    it('throws when invoking', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.mount()`')
        expect(err.docsUrl).to.eq('https://on.cypress.io/mount')

        done()
      })

      cy.mount()
    })
  })
})
