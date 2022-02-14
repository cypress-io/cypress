import { assertLogLength } from '../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
describe('navigation events', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  let logs: any = []

  beforeEach(() => {
    logs = []

    cy.on('log:added', (attrs, log) => {
      logs.push(log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  describe('navigation:changed', () => {
    it('navigation:changed via hashChange', () => {
      cy.switchToDomain('foobar.com', () => {
        const p = new Promise<void>((resolve) => {
          const listener = () => {
            cy.location().should((loc) => {
              expect(loc.host).to.equal('www.foobar.com:3500')
              expect(loc.pathname).to.equal('/fixtures/multi-domain-secondary.html')
              expect(loc.hash).to.equal('#hashChange')
            })

            resolve()
          }

          cy.once('navigation:changed', listener)
        })

        cy.get('a[data-cy="hashChange"]').click()
        cy.wrap(p)
      })
    })

    // TODO: this test should work but there seems to be a problem where the command queue ends prematurely
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

  describe('window:load', () => {
    it('reloads', () => {
      cy.switchToDomain('foobar.com', () => {
        const p = new Promise<void>((resolve) => {
          let times = 0
          const listener = (win) => {
            times++
            expect(win.location.host).to.equal('www.foobar.com:3500')
            expect(win.location.pathname).to.equal('/fixtures/multi-domain-secondary.html')

            if (times === 2) {
              cy.removeListener('window:load', listener)
              resolve()
            }
          }

          cy.on('window:load', listener)
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
        const p = new Promise<void>((resolve) => {
          let times = 0
          const listener = (win) => {
            times++
            if (times === 1) {
              expect(win.location.host).to.equal('www.foobar.com:3500')
              expect(win.location.pathname).to.equal('/fixtures/multi-domain-secondary.html')
            }

            if (times === 2) {
              cy.removeListener('window:load', listener)
              expect(win.location.host).to.equal('www.foobar.com:3500')
              expect(win.location.pathname).to.equal('/fixtures/multi-domain.html')
              resolve()
            }
          }

          cy.on('window:load', listener)
        })

        cy.get('a[data-cy="multi-domain-page"]').click()
        cy.get('a[data-cy="multi-domain-secondary-link').invoke('text').should('equal', 'http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')
        cy.wrap(p)
      }).then(() => {
        assertLogLength(logs, 18)
        expect(logs[10].get('name')).to.eq('page load')
        expect(logs[11].get('name')).to.eq('new url')
        expect(logs[11].get('message')).to.eq('http://www.foobar.com:3500/fixtures/multi-domain.html')
      })
    })
  })

  describe('url:changed', () => {
    it('reloads', () => {
      cy.switchToDomain('foobar.com', () => {
        const p = new Promise<void>((resolve) => {
          cy.once('url:changed', (url) => {
            expect(url).to.equal('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')
            resolve()
          })
        })

        cy.get('button[data-cy="reload"]').click()
        cy.wrap(p)
      })
    })

    it('navigates to a new page', () => {
      cy.switchToDomain('foobar.com', () => {
        const p = new Promise<void>((resolve) => {
          let times = 0
          const listener = (url) => {
            times++
            if (times === 1) {
              expect(url).to.equal('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')
            }

            if (times === 2) {
              cy.removeListener('url:changed', listener)
              expect(url).to.equal('http://www.foobar.com:3500/fixtures/multi-domain.html')
              resolve()
            }
          }

          cy.on('url:changed', listener)
        })

        cy.get('a[data-cy="multi-domain-page"]').click()
        cy.wrap(p)
      })
    })

    // TODO: this test should re revisited with the cypress in cypress tests available in 10.0
    it.skip('the runner url updates appropriately', () => {
      cy.switchToDomain('foobar.com', () => {
        cy.get('a[data-cy="multi-domain-page"]').click()
      })
    })
  })
})
