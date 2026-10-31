const AGENTS_PAGE = 'http://www.foobar.com:3500/fixtures/remote-driver-isolation.html'

describe('remote driver: dialogs, stubs and spies', { experimentalRemoteDriver: true }, () => {
  describe('dialogs', () => {
    beforeEach(() => {
      cy.visit(AGENTS_PAGE)
    })

    it('reports an alert to window:alert and lets the page continue', () => {
      const alerts: string[] = []

      cy.on('window:alert', (text) => {
        alerts.push(text)
      })

      cy.get('#alert').click()
      cy.get('#dialog-result').should('have.text', 'alerted')
      cy.wrap(alerts).should('deep.equal', ['app alert'])
    })

    it('accepts a confirm and reports it to window:confirm', () => {
      const confirms: string[] = []

      cy.on('window:confirm', (text) => {
        confirms.push(text)
      })

      cy.get('#confirm').click()
      cy.get('#dialog-result').should('have.text', 'confirmed:true')
      cy.wrap(confirms).should('deep.equal', ['app confirm'])
    })

    it('answers a confirm with a stub', () => {
      cy.window().then((win) => {
        cy.stub(win, 'confirm').as('confirm').returns(false)
      })

      cy.get('#confirm').click()
      cy.get('#dialog-result').should('have.text', 'confirmed:false')
      cy.get('@confirm').should('have.been.calledOnceWith', 'app confirm')
    })

    it('leaves a prompt unanswered', () => {
      cy.get('#prompt').click()
      cy.get('#dialog-result').should('have.text', 'prompted:null')
    })
  })

  describe('stubs and spies on the AUT window', () => {
    it('stubs a method before the AUT loads', () => {
      cy.window().then((win) => {
        cy.stub(win, 'open').as('open').returns(null)
      })

      cy.visit(AGENTS_PAGE)
      cy.get('#open').click()
      cy.get('#probe-result').should('have.text', 'opened:null')
      cy.get('@open').should('have.been.calledOnceWith', 'http://www.foobar.com:3500/fixtures/remote-driver-isolation.html?page=popup', '_blank')
    })

    it('spies on a method and still calls it', () => {
      cy.visit(AGENTS_PAGE)
      cy.window().then((win) => {
        cy.spy(win.console, 'log').as('log')
      })

      cy.get('#log').click()
      cy.get('#probe-result').should('have.text', 'logged')
      cy.get('@log').should('have.been.calledWith', 'app log', { clicks: 0 })
    })

    it('picks a behavior by its arguments and runs a fake in the AUT', () => {
      cy.visit(AGENTS_PAGE)
      cy.window().then((win) => {
        const double = cy.stub(Reflect.get(win, 'appMath'), 'double').callsFake((n) => n * 10)

        double.withArgs(2).returns(40)
        cy.wrap(double).as('double')
      })

      cy.get('#compute').click()
      cy.get('#probe-result').should('have.text', 'computed:40,30')
      cy.get('@double').should('have.been.calledTwice').and('have.been.calledWith', 3)
    })

    it('restores the AUT\'s methods for the next test', () => {
      cy.visit(AGENTS_PAGE)
      cy.get('#compute').click()
      cy.get('#probe-result').should('have.text', 'computed:4,6')
    })
  })
})
