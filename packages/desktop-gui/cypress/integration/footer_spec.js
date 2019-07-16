describe('Footer', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')

    cy.visitIndex().then(function (win) {
      let start = win.App.start

      this.win = win
      this.ipc = win.App.ipc
      this.version = '1.0.0'

      cy.stub(this.ipc, 'getOptions').resolves({ version: this.version })
      cy.stub(this.ipc, 'updaterCheck').resolves(false)
      cy.stub(this.ipc, 'getProjects').resolves([])
      cy.stub(this.ipc, 'getProjectStatuses').resolves([])
      cy.stub(this.ipc, 'externalOpen')

      start()
    })
  })

  it('shows footer', () => {
    cy.get('footer').should('be.visible')
  })

  it('displays version sent from get:options', function () {
    cy.get('footer').contains(this.version)
  })

  it('opens link to changelog on click of changelog', () => {
    cy.get('a').contains('Changelog').click().then(function () {
      expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/changelog')
    })
  })
})
