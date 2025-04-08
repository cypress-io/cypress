import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin viewport', { browser: '!webkit' }, () => {
  it('syncs the viewport from the primary to secondary', () => {
    // change the viewport in the primary first
    cy.viewport(320, 480)

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://www.foobar.com:3500', () => {
      const viewportChangedSpy = cy.spy()

      cy.on('viewport:changed', viewportChangedSpy)

      // changing the viewport to the same size shouldn't do anything
      cy.viewport(320, 480).then(() => {
        expect(viewportChangedSpy).not.to.be.called
      })

      cy.window().then((win) => {
        expect(win.innerWidth).to.equal(320)
        expect(win.innerHeight).to.equal(480)
      })
    })
  })

  context('with out pre-set viewport', () => {
    beforeEach(() => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    })

    context('.viewport()', () => {
      it('changes the viewport', () => {
        cy.origin('http://www.foobar.com:3500', () => {
          cy.window().then((win) => {
            expect(win.innerHeight).to.equal(660)
            expect(win.innerWidth).to.equal(1000)
          })

          cy.viewport(320, 480)

          cy.window().its('innerHeight').should('eq', 480)
          cy.window().its('innerWidth').should('eq', 320)
        })
      })

      it('resets the viewport between tests', () => {
        cy.origin('http://www.foobar.com:3500', () => {
          cy.window().then((win) => {
            expect(win.innerHeight).to.equal(660)
            expect(win.innerWidth).to.equal(1000)
          })
        })
      })

      context('cy.on(\'viewport:changed\')', () => {
        it('calls viewport:changed handler in cy.origin', () => {
          cy.origin('http://www.foobar.com:3500', () => {
            const viewportChangedSpy = cy.spy()

            cy.on('viewport:changed', viewportChangedSpy)

            cy.viewport(320, 480).then(() => {
              expect(viewportChangedSpy).to.be.calledOnce
            })
          })
        })

        it('does NOT call viewport:changed handler of primary', () => {
          const viewportChangedSpy = cy.spy()

          cy.on('viewport:changed', viewportChangedSpy)

          cy.origin('http://www.foobar.com:3500', () => {
            cy.viewport(320, 480)
          }).then(() => {
            expect(viewportChangedSpy).not.to.be.called
          })
        })
      })

      context('Cypress.on(\'viewport:changed\')', () => {
        let viewportChangedSpyPrimary

        before(() => {
          viewportChangedSpyPrimary = cy.spy()
          cy.origin('http://www.foobar.com:3500', () => {
          // using global since a function can't be passed to cy.origin
          // and we need to be able to remove the listener in the 'after' hook
            globalThis.viewportChangedSpySecondary = cy.spy()
          })
        })

        after(() => {
          Cypress.off('viewport:changed', viewportChangedSpyPrimary)
          cy.origin('http://www.foobar.com:3500', () => {
            Cypress.off('viewport:changed', globalThis.viewportChangedSpySecondary)
          })

          delete globalThis.viewportChangedSpySecondary
        })

        it('calls viewport:changed handler in cy.origin', () => {
          cy.origin('http://www.foobar.com:3500', () => {
            Cypress.on('viewport:changed', globalThis.viewportChangedSpySecondary)

            cy.viewport(320, 480).then(() => {
              expect(globalThis.viewportChangedSpySecondary).to.be.calledOnce
            })
          })
        })

        it('does NOT call viewport:changed handler of primary', () => {
          Cypress.on('viewport:changed', viewportChangedSpyPrimary)

          cy.origin('http://www.foobar.com:3500', () => {
            cy.viewport(320, 480)
          }).then(() => {
            expect(viewportChangedSpyPrimary).not.to.be.called
          })
        })
      })

      it('syncs the viewport from the secondary to primary', () => {
        const viewportChangedSpy = cy.spy()

        cy.on('viewport:changed', viewportChangedSpy)

        cy.origin('http://www.foobar.com:3500', () => {
        // change the viewport in the secondary first
          cy.viewport(320, 480)

          cy.window().then((win) => {
            win.location.href = 'http://localhost:3500/fixtures/primary-origin.html'
          })
        })

        // changing the viewport to the same size shouldn't do anything
        cy.viewport(320, 480).then(() => {
          expect(viewportChangedSpy).not.to.be.called
        })

        cy.window().then((win) => {
          expect(win.innerWidth).to.equal(320)
          expect(win.innerHeight).to.equal(480)
        })
      })

      it('syncs the viewport across multiple origins', () => {
        cy.origin('http://www.foobar.com:3500', () => {
          cy.viewport(320, 480)

          cy.window().its('innerHeight').should('eq', 480)
          cy.window().its('innerWidth').should('eq', 320)

          cy.window().then((win) => {
            win.location.href = 'http://www.idp.com:3500/fixtures/primary-origin.html'
          })
        })

        cy.origin('http://www.idp.com:3500', () => {
          const viewportChangedSpy = cy.spy()

          cy.on('viewport:changed', viewportChangedSpy)

          // changing the viewport to the same size shouldn't do anything
          cy.viewport(320, 480).then(() => {
            expect(viewportChangedSpy).not.to.be.called
          })

          cy.window().then((win) => {
            expect(win.innerWidth).to.equal(320)
            expect(win.innerHeight).to.equal(480)
          })
        })
      })
    })

    context('#consoleProps', () => {
      let logs: Map<string, any>

      beforeEach(() => {
        logs = new Map()

        cy.on('log:changed', (attrs, log) => {
          logs.set(attrs.id, log)
        })
      })

      it('.viewport()', () => {
        cy.origin('http://www.foobar.com:3500', () => {
          cy.viewport(320, 480)
        })

        cy.shouldWithTimeout(() => {
          const { consoleProps } = findCrossOriginLogs('viewport', logs, 'foobar.com')

          expect(consoleProps.name).to.equal('viewport')
          expect(consoleProps.type).to.equal('command')
          expect(consoleProps.props.Width).to.equal(320)
          expect(consoleProps.props.Height).to.equal(480)
        })
      })
    })
  })
})
