import { assertLogLength } from '../../../support/utils'

// makes logs coming from secondary domain work with `assertLogLength`
const reifyLogs = (logs) => {
  return logs.map((attrs) => {
    return {
      get (name) {
        return attrs[name]
      },
    }
  })
}

// @ts-ignore / session support is needed for visiting about:blank between tests
describe('navigation events', { experimentalSessionSupport: true }, () => {
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
      cy.switchToDomain('http://foobar.com:3500', () => {
        const afterNavigationChanged = new Promise<void>((resolve) => {
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
        cy.wrap(afterNavigationChanged)
      })
    })

    // TODO: this test should work but there seems to be a problem where the command queue ends prematurely
    it.skip('navigates forward and back using history', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
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
      cy.switchToDomain('http://foobar.com:3500', () => {
        const logs: any[] = []

        cy.on('log:added', (attrs, log) => {
          logs.push(log)
        })

        const afterWindowLoad = new Promise<void>((resolve) => {
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
        cy.wrap(afterWindowLoad).then(() => {
          return logs.map((log) => ({ name: log.get('name') }))
        })
      })
      .then(reifyLogs)
      .then((secondaryLogs) => {
        assertLogLength(secondaryLogs, 9)
        expect(secondaryLogs[5].get('name')).to.eq('page load')
      })
    })

    it('navigates to a new page', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        const logs: any[] = []

        cy.on('log:added', (attrs, log) => {
          logs.push(log)
        })

        const afterWindowLoad = new Promise<void>((resolve) => {
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
        cy.wrap(afterWindowLoad).then(() => {
          return logs.map((log) => ({ name: log.get('name'), message: log.get('message') }))
        })
      })
      .then(reifyLogs)
      .then((secondaryLogs) => {
        assertLogLength(secondaryLogs, 13)
        expect(secondaryLogs[5].get('name')).to.eq('page load')
        expect(secondaryLogs[6].get('name')).to.eq('new url')
        expect(secondaryLogs[6].get('message')).to.eq('http://www.foobar.com:3500/fixtures/multi-domain.html')
      })
    })
  })

  describe('url:changed', () => {
    it('reloads', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        const afterUrlChanged = new Promise<void>((resolve) => {
          cy.once('url:changed', (url) => {
            expect(url).to.equal('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')
            resolve()
          })
        })

        cy.get('button[data-cy="reload"]').click()
        cy.wrap(afterUrlChanged)
      })
    })

    it('navigates to a new page', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        const afterUrlChanged = new Promise<void>((resolve) => {
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
        cy.wrap(afterUrlChanged)
      })
    })

    // TODO: this test should re revisited with the cypress in cypress tests available in 10.0
    it.skip('the runner url updates appropriately', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        cy.get('a[data-cy="multi-domain-page"]').click()
      })
    })
  })
})

// @ts-ignore / session support is needed for visiting about:blank between tests
describe('delayed navigation', { experimentalSessionSupport: true, defaultCommandTimeout: 2000 }, () => {
  it('localhost -> localhost', () => {
    cy.visit('/fixtures/auth/delayedNavigate.html')
    cy.get('[data-cy="to-localhost"]').click()
    cy.get('[data-cy="login-idp"]')
  })

  it('localhost -> foobar, delay in', () => {
    cy.visit('/fixtures/auth/delayedNavigate.html')
    cy.get('[data-cy="to-foobar"]').click()
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('[data-cy="login-idp"]')
    })
  })

  it('foobar -> localhost, delay out', () => {
    cy.visit('/fixtures/auth/index.html')
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/auth/delayedNavigate.html')
      cy.get('[data-cy="to-localhost"]').click()
    })

    cy.get('[data-cy="login-idp"]')
  })

  it('foobar -> idp, delay out', () => {
    cy.visit('/fixtures/auth/index.html')
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/auth/delayedNavigate.html')
      cy.get('[data-cy="to-idp"]').click()
    })

    cy.switchToDomain('http://idp.com:3500', () => {
      cy.get('[data-cy="login-idp"]')
    })
  })
})

// @ts-ignore / session support is needed for visiting about:blank between tests
describe('sub domain window loads before multi-domain command', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('establish a foobar spec bridge', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('a[data-cy="multi-domain-page"]')
    })
  })

  it('page load before switchToDomain command when spec bridge is already established', () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        cy.switchToDomain('http://foobar.com:3500', () => {
          cy.get('a[data-cy="multi-domain-page"]')
        }).then(resolve)
      }, 2100)// this number should be larger than the delay cross origin domains.
    })
  })
})
