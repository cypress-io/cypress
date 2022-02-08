const { assertLogLength } = require('../../../support/utils')

// @ts-ignore / session support is needed for visiting about:blank between tests
describe('navigation', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  let logs: any = []

  describe('navigation events', () => {
    beforeEach(() => {
      logs = []

      cy.on('log:added', (attrs, log) => {
        logs.push(log)
      })

      cy.visit('/fixtures/multi-domain.html')
      cy.get('a[data-cy="multi-domain-secondary-link"]').click()
    })

    it('navigation:changed via hashChange', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('navigation:changed', () => {
          expect(location.host).to.equal('foobar.com')
          done()
        })

        cy.get('a[data-cy="hashChange"]').click()
      })
    })

    it('reloads', () => {
      cy.switchToDomain('foobar.com', () => {
        const p = new Promise((resolve) => {
          let times = 0
          const listener = (win) => {
            times++
            expect(win.location.host).to.equal('www.foobar.com:3500')
            expect(win.location.pathname).to.equal('/fixtures/multi-domain-secondary.html')

            if (times === 2) {
              Cypress.removeListener('window:load', listener)
              resolve('')
            }
          }

          Cypress.on('window:load', listener)
          resolve('')
        })

        cy.get('button[data-cy="reload"]').click()
        cy.wrap(p)
      }).then(() => {
        assertLogLength(logs, 14)
        expect(logs[10].get('name')).to.eq('page load')
      })
    })

    it('navigates to a new page', () => {
      cy.switchToDomain('foobar.com', () => {
        const p = new Promise((resolve) => {
          let times = 0
          const listener = (win) => {
            times++
            if (times === 1) {
              expect(win.location.host).to.equal('www.foobar.com:3500')
              expect(win.location.pathname).to.equal('/fixtures/multi-domain-secondary.html')
            }

            if (times === 2) {
              Cypress.removeListener('window:load', listener)
              expect(win.location.host).to.equal('www.foobar.com:3500')
              expect(win.location.pathname).to.equal('/fixtures/multi-domain.html')
              resolve('')
            }
          }

          Cypress.on('window:load', listener)
        })

        cy.get('a[data-cy="multi-domain-page"]').click()
        cy.wrap(p)
      }).then(() => {
        assertLogLength(logs, 15)
        expect(logs[10].get('name')).to.eq('page load')
        expect(logs[11].get('name')).to.eq('new url')
        expect(logs[11].get('message')).to.eq('http://www.foobar.com:3500/fixtures/multi-domain.html')
      })
    })

    // TODO this test should work but there seems to be a problem where the command queue ends prematurely
    it.skip('navigates forward and back using history', () => {
      cy.switchToDomain('foobar.com', () => {
        cy.get('a[data-cy="multi-domain-page"]').click()
        .window().then((win) => {
          return new Promise((resolve) => {
            cy.once('navigation:changed', resolve)

            win.history.back()
          }).then(() => {
            return new Promise((resolve) => {
              cy.once('navigation:changed', resolve)

              win.history.forward()
            })
          })
        })
      })
    })
  })
})

context('testing', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain-secondary.html')
  })

  it('navigation:changed via hashChange', (done) => {
    Cypress.once('navigation:changed', () => {
      expect(location.host).to.equal('localhost:3500')
      // expect(location.pathname).to.include('/fixtures/multi-domain-secondary.html')
      // expect(location.hash).to.equal('#hashChange')
      done()
    })

    cy.get('a[data-cy="hashChange"]').click()
  })

  it('reloads', () => {
    // Cypress.once('navigation:changed', () => {
    //   expect(location.host).to.equal('localhost:3500')
    //   expect(location.pathname).to.equal('/fixtures/multi-domain-secondary.html')
    //   done()
    // })

    cy.get('button[data-cy="reload"]').click()
  })

  it('navigation:changed via navigating to new page', (
  ) => {
    // Cypress.once('navigation:changed', () => {
    //   expect(location.host).to.equal('localhost:3500')
    //   expect(location.pathname).to.equal('/fixtures/multi-domain.html')
    //   done()
    // })

    cy.get('a[data-cy="multi-domain-page"]').click()
  })

  it('navigates forward and back using history', () => {
    cy.get('a[data-cy="multi-domain-page"]').click()
    .window().then((win) => {
      return new Promise((resolve) => {
        cy.once('navigation:changed', resolve)

        win.history.back()
      }).then(() => {
        return new Promise((resolve) => {
          cy.once('navigation:changed', resolve)

          win.history.forward()
        })
      })
    })
  })

  it.skip('testing', () => {
    cy.on('navigation:changed', () => {
      console.log('navigation changed')
    })

    cy.get('a[data-cy="hashChange"]').click()
    cy.get('button[data-cy="reload"]').click()
    cy.get('a[data-cy="multi-domain-page"]').click()
  })
})
