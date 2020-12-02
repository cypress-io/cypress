describe('Footer', () => {
  const version = '1.0.0'
  let start
  let ipc

  beforeEach(() => {
    cy.fixture('user').as('user')

    cy.visitIndex().then((win) => {
      start = win.App.start
      ipc = win.App.ipc

      cy.stub(ipc, 'getOptions').resolves({ version })
      cy.stub(ipc, 'updaterCheck').resolves(false)
      cy.stub(ipc, 'getProjects').resolves([])
      cy.stub(ipc, 'getProjectStatuses').resolves([])
      cy.stub(ipc, 'externalOpen')
    })
  })

  describe('any case', () => {
    beforeEach(() => {
      start()
    })

    it('shows footer', () => {
      cy.get('footer').should('be.visible')
    })

    it('displays version sent from get:options', () => {
      cy.get('footer').contains(version)
    })

    it('opens link to changelog on click of changelog', () => {
      cy.contains('button', 'Changelog').click().then(() => {
        expect(ipc.externalOpen).to.be.calledWith('https://on.cypress.io/changelog?source=dgui_footer')
      })
    })

    it('blurs changelog button after clicking', () => {
      cy.contains('button', 'Changelog').click().should('not.be.focused')
      cy.percySnapshot()
    })
  })

  describe('when on the latest version', () => {
    beforeEach(() => {
      start()
    })

    it('does not show update indicator', () => {
      cy.get('.update-indicator').should('not.be.visible')
      cy.percySnapshot()
    })

    it('disables version button', () => {
      cy.get('.version').should('be.disabled')
    })
  })

  describe('when there is a newer version available', () => {
    beforeEach(() => {
      ipc.updaterCheck.resolves('1.0.1')

      start()
    })

    it('shows update indicator', () => {
      cy.get('.update-indicator').should('be.visible')
      cy.percySnapshot()
    })

    it('enables version button', () => {
      cy.get('.version').should('be.enabled')
    })

    it('opens update modal after clicking version button', () => {
      cy.get('.version').click()
      cy.get('.update-modal').should('be.visible')
    })

    it('closes modal after clicking close', () => {
      cy.get('.version').click()
      cy.get('.update-modal .close').click()
      cy.get('.update-modal').should('not.exist')
    })

    it('blurs version button after clicking', () => {
      cy.get('.version').click().should('not.be.focused')
      cy.get('.update-modal .close').click()
      cy.percySnapshot()
    })
  })
})
