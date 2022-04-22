describe('stability', () => {
  describe('before each transitions', () => {
    describe('transitioning from a before block to an it block while unstable', () => {
      beforeEach(() => {
        cy.visit('/fixtures/auth/index.html')
        cy.window().then((win) => {
          win.location.href = 'http://localhost:3500/timeout?ms=1000'
        })
      })

      it('fails if the page does not load within the page load timeout', { defaultCommandTimeout: 50, pageLoadTimeout: 500 }, (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include(`Timed out after waiting \`500ms\` for your remote page to load.`)
          done()
        })

        cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      })

      it('waits for the page to load before running the command', { defaultCommandTimeout: 50 }, () => {
        cy.get('body').invoke('text').should('equal', 'timeout')
      })

      it('will retry and fail the command after the page loads', { defaultCommandTimeout: 50 }, (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include(`Timed out retrying after 50ms: expected 'timeout' to equal 'not timeout'`)
          done()
        })

        cy.get('body').invoke('text').should('equal', 'not timeout')
      })
    })
  })
})
