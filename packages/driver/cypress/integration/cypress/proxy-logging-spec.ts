describe('Proxy Logging', () => {
  it('intercepted cy.visits do not wait for a pre-request', () => {
    cy.intercept('*', () => {})

    cy.visit('/fixtures/empty.html', { timeout: 1000 })
  })

  context('logs', () => {
    it('logs fetches', (done) => {
      fetch('/something')

      cy.once('log:added', (log) => {
        expect(log).to.include({
          displayName: 'fetch',
          method: 'GET',
          url: 'http://localhost:3500/something',
        })

        expect(log.renderProps).to.include({
          message: 'GET /something',
        })

        done()
      })
    })

    context('with cy.route', () => {
      it('xhr logs are correlated', () => {

      })
    })

    context('with cy.intercept', () => {
      it('intercepted fetches are correlated', (done) => {
        let xhrLogCount = 0

        cy.on('log:added', ({ name }) => name === 'xhr' && xhrLogCount++)
        cy.intercept('/foo')
        .then(() => {
          cy.once('log:changed', (log) => {
            // route instrument log updates first
            expect(log).to.include({ name: 'route' })
            cy.once('log:changed', (log) => {
              // next the proxy-logging log will be updated with the intercept
              expect(log).to.include({
                name: 'xhr',
                displayName: 'intercept',
                url: 'http://localhost:3500/foo',
              })

              // because there was a pre-request, this should exist on the log object
              expect(log.browserPreRequest).to.include({
                method: 'GET',
                url: log.url,
              })

              expect(xhrLogCount).to.eq(1)

              done()
            })
          })

          fetch('/foo')
        })
      })
    })
  })
})
