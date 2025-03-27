import { assertLogLength } from '../../../support/utils'

// makes logs coming from secondary origin work with `assertLogLength`
const reifyLogs = (logs) => {
  return logs.map((attrs) => {
    return {
      get (name) {
        return attrs[name]
      },
    }
  })
}

describe('navigation events', { browser: '!webkit' }, () => {
  let logs: any = []

  beforeEach(() => {
    logs = []

    cy.on('log:added', (attrs, log) => {
      logs.push(log)
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  describe('navigation:changed', () => {
    it('navigation:changed via hashChange', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const afterNavigationChanged = new Promise<void>((resolve) => {
          const listener = () => {
            const loc = cy.getRemoteLocation()

            expect(loc.host).to.equal('www.foobar.com:3500')
            expect(loc.pathname).to.equal('/fixtures/secondary-origin.html')
            expect(loc.hash).to.equal('#hashChange')

            resolve()
          }

          cy.once('navigation:changed', listener)
        })

        cy.get('a[data-cy="hashChange"]').click()
        cy.wrap(afterNavigationChanged)
      })
    })

    it('navigates forward and back using history', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const onLoad = (cb) => {
          const onNavChanged = (event) => {
            if (event === 'page navigation event (load)') {
              cy.off('navigation:changed', onNavChanged)
              cb()
            }
          }

          cy.on('navigation:changed', onNavChanged)
        }

        cy.get('a[data-cy="cross-origin-page"]').click()
        .window().then((win) => {
          return new Promise<void>((resolve) => {
            onLoad(resolve)

            win.history.back()
          }).then(() => {
            return new Promise<void>((resolve) => {
              onLoad(resolve)

              win.history.forward()
            })
          })
        })
      })
    })
  })

  describe('window:load', () => {
    it('reloads', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const logs: any[] = []

        cy.on('log:added', (attrs, log) => {
          logs.push(log)
        })

        const afterWindowLoad = new Promise<void>((resolve) => {
          const listener = (win) => {
            expect(win.location.host).to.equal('www.foobar.com:3500')
            expect(win.location.pathname).to.equal('/fixtures/secondary-origin.html')

            resolve()
          }

          cy.once('window:load', listener)
        })

        cy.get('button[data-cy="reload"]').click()
        cy.wrap(afterWindowLoad).then(() => {
          return logs.map((log) => ({ name: log.get('name') }))
        })
      })
      .then(reifyLogs)
      .then((secondaryLogs) => {
        assertLogLength(secondaryLogs, 6)
        expect(secondaryLogs[2].get('name')).to.eq('page load')
      })
    })

    it('navigates to a new page', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const logs: any[] = []

        cy.on('log:added', (attrs, log) => {
          logs.push(log)
        })

        const afterWindowLoad = new Promise<void>((resolve) => {
          const listener = (win) => {
            expect(win.location.host).to.equal('www.foobar.com:3500')
            expect(win.location.pathname).to.equal('/fixtures/primary-origin.html')
            resolve()
          }

          cy.once('window:load', listener)
        })

        cy.get('a[data-cy="cross-origin-page"]').click()
        cy.get('a[data-cy="cross-origin-secondary-link').invoke('text').should('equal', 'http://www.foobar.com:3500/fixtures/secondary-origin.html')
        cy.wrap(afterWindowLoad).then(() => {
          return logs.map((log) => ({ name: log.get('name'), message: log.get('message') }))
        })
      })
      .then(reifyLogs)
      .then((secondaryLogs) => {
        assertLogLength(secondaryLogs, 9)
        expect(secondaryLogs[2].get('name')).to.eq('page load')
      })
    })
  })

  describe('url:changed', () => {
    it('reloads', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const afterUrlChanged = new Promise<void>((resolve) => {
          cy.once('url:changed', (url) => {
            expect(url).to.equal('http://www.foobar.com:3500/fixtures/secondary-origin.html')
            resolve()
          })
        })

        cy.get('button[data-cy="reload"]').click()
        cy.wrap(afterUrlChanged)
      })
    })

    it('navigates to a new page', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const afterUrlChanged = new Promise<void>((resolve) => {
          const listener = (url) => {
            cy.removeListener('url:changed', listener)
            expect(url).to.equal('http://www.foobar.com:3500/fixtures/primary-origin.html')
            resolve()
          }

          cy.once('url:changed', listener)
        })

        cy.get('a[data-cy="cross-origin-page"]').click()
        cy.wrap(afterUrlChanged)
      })
    })

    // TODO: this test should re revisited with the cypress in cypress tests available in 10.0
    // https://github.com/cypress-io/cypress/issues/20973
    it.skip('the runner url updates appropriately', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('a[data-cy="cross-origin-page"]').click()
      })
    })
  })
})

// @ts-ignore / session support is needed for visiting about:blank between tests
describe('event timing', { browser: '!webkit' }, () => {
  it('does not timeout when receiving a delaying:html event after cy.origin has started, but before the spec bridge is ready', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://www.foobar.com:3500', () => {
      cy.log('inside cy.origin foobar')
      // Updating href is one of the few allowed commands. See https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy#location
      // However, not everything on the window is accessible. Therefore, we force window() to only run on the same origin as the AUT context
      cy.window().then((win) => {
        win.location.href = 'http://www.idp.com:3500/fixtures/primary-origin.html'
      })
    })

    cy.origin('http://www.idp.com:3500', () => {
      cy.log('inside cy.origin idp')
    })
  })
})

// @ts-ignore / session support is needed for visiting about:blank between tests
describe('delayed navigation', { browser: '!webkit' }, { defaultCommandTimeout: 2000 }, () => {
  it('localhost -> localhost', () => {
    cy.visit('/fixtures/auth/delayedNavigate.html')
    cy.get('[data-cy="to-localhost"]').click()
    cy.get('[data-cy="login-idp"]')
  })

  it('localhost -> foobar, delay in', () => {
    cy.visit('/fixtures/auth/delayedNavigate.html')
    cy.get('[data-cy="to-foobar"]').click()
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('[data-cy="login-idp"]')
    })
  })

  it('foobar -> localhost, delay out', () => {
    cy.visit('/fixtures/auth/index.html')
    cy.origin('http://www.foobar.com:3500', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/auth/delayedNavigate.html')
      cy.get('[data-cy="to-localhost"]').click()
    })

    cy.get('[data-cy="login-idp"]')
  })

  it('foobar -> idp, delay out', () => {
    cy.visit('/fixtures/auth/index.html')
    cy.origin('http://www.foobar.com:3500', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/auth/delayedNavigate.html')
      cy.get('[data-cy="to-idp"]').click()
    })

    cy.origin('http://www.idp.com:3500', () => {
      cy.get('[data-cy="login-idp"]')
    })
  })
})

// @ts-ignore / session support is needed for visiting about:blank between tests
describe('errors', { browser: '!webkit' }, () => {
  it('never calls cy.origin', { defaultCommandTimeout: 50 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms:`)
      expect(err.message).to.include(`The command was expected to run against origin \`http://localhost:3500\` but the application is at origin \`http://www.foobar.com:3500\`.`)
      expect(err.message).to.include(`This commonly happens when you have either not navigated to the expected origin or have navigated away unexpectedly.`)
      expect(err.message).to.include(`Using \`cy.origin()\` to wrap the commands run on \`http://www.foobar.com:3500\` will likely fix this issue.`)
      expect(err.message).to.include(`cy.origin('http://www.foobar.com:3500', () => {\`\n\`  <commands targeting http://www.foobar.com:3500 go here>\`\n\`})`)
      //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-foobar"]').click()
    cy.get('[data-cy="cannot-find"]') // Timeout here on command, cannot find element
  })

  it('never redirects to the cross-origin', { defaultCommandTimeout: 50 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms:`)
      expect(err.message).to.include(`The command was expected to run against origin \`http://www.idp.com:3500\` but the application is at origin \`http://localhost:3500\`.`)
      expect(err.message).to.include(`This commonly happens when you have either not navigated to the expected origin or have navigated away unexpectedly.`)
      expect(err.message).to.include(`Using \`cy.origin()\` to wrap the commands run on \`http://localhost:3500\` will likely fix this issue.`)
      expect(err.message).to.include(`cy.origin('http://localhost:3500', () => {\`\n\`  <commands targeting http://localhost:3500 go here>\`\n\`})`)
      //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-idp"]')
    cy.origin('http://www.idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson') // Timeout here on command, cannot find element
      cy.get('[data-cy="login"]').click()
    })

    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  it('redirects to the wrong cross-origin', { defaultCommandTimeout: 50 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms:`)
      expect(err.message).to.include(`The command was expected to run against origin \`http://www.idp.com:3500\` but the application is at origin \`http://www.foobar.com:3500\`.`)
      expect(err.message).to.include(`This commonly happens when you have either not navigated to the expected origin or have navigated away unexpectedly.`)
      expect(err.message).to.include(`Using \`cy.origin()\` to wrap the commands run on \`http://www.foobar.com:3500\` will likely fix this issue.`)
      expect(err.message).to.include(`cy.origin('http://www.foobar.com:3500', () => {\`\n\`  <commands targeting http://www.foobar.com:3500 go here>\`\n\`})`)
      //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-foobar"]').click() // Timeout on page load here, we never reach the expected origin
    cy.origin('http://www.idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson')
      cy.get('[data-cy="login"]').click()
    })

    // Verify that the user has logged in on localhost
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  it('never returns to the primary origin', { defaultCommandTimeout: 50 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms:`)
      expect(err.message).to.include(`The command was expected to run against origin \`http://localhost:3500\` but the application is at origin \`http://www.idp.com:3500\`.`)
      expect(err.message).to.include(`Using \`cy.origin()\` to wrap the commands run on \`http://www.idp.com:3500\` will likely fix this issue.`)
      expect(err.message).to.include(`cy.origin('http://www.idp.com:3500', () => {\`\n\`  <commands targeting http://www.idp.com:3500 go here>\`\n\`})`)
      //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-idp"]').click()
    cy.origin('http://www.idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson')
    }) // cy.origin is stable so the command exits

    // Verify that the user has logged in on localhost
    cy.get('[data-cy="welcome"]') // Timeout here on command, cannot find element
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  it('redirects to an unexpected cross-origin', { defaultCommandTimeout: 50 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms:`)
      expect(err.message).to.include(`The command was expected to run against origin \`http://localhost:3500\` but the application is at origin \`http://www.foobar.com:3500\`.`)
      expect(err.message).to.include(`Using \`cy.origin()\` to wrap the commands run on \`http://www.foobar.com:3500\` will likely fix this issue.`)
      expect(err.message).to.include(`cy.origin('http://www.foobar.com:3500', () => {\`\n\`  <commands targeting http://www.foobar.com:3500 go here>\`\n\`})`)
      //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-idp"]').click()
    cy.origin('http://www.idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson')
      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/fixtures/auth/index.html'
      })
    })

    // Verify that the user has logged in on localhost
    cy.get('[data-cy="welcome"]') // Stability is false, this command is prevented from running until stability is achieved.
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  it('redirects to an unexpected cross-origin and calls another command in the cy.origin command', { pageLoadTimeout: 5000, defaultCommandTimeout: 50 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms:`)
      expect(err.message).to.include(`The command was expected to run against origin \`http://www.idp.com:3500\` but the application is at origin \`http://www.foobar.com:3500\`.`)
      expect(err.message).to.include(`Using \`cy.origin()\` to wrap the commands run on \`http://www.foobar.com:3500\` will likely fix this issue.`)
      expect(err.message).to.include(`cy.origin('http://www.foobar.com:3500', () => {\`\n\`  <commands targeting http://www.foobar.com:3500 go here>\`\n\`})`)
      //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-idp"]').click()
    cy.origin('http://www.idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson')
      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/fixtures/auth/index.html'
      })

      cy.get('[data-cy="welcome"]') // Timeout here on command, cannot find element
    })

    // Verify that the user has logged in on localhost
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23481
  it('fails in cy.origin when a command is run after we return to localhost', { defaultCommandTimeout: 50, retries: 15 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms:`)
      expect(err.message).to.include(`The command was expected to run against origin \`http://www.idp.com:3500\` but the application is at origin \`http://localhost:3500\`.`)
      expect(err.message).to.include(`Using \`cy.origin()\` to wrap the commands run on \`http://localhost:3500\` will likely fix this issue.`)
      expect(err.message).to.include(`cy.origin('http://localhost:3500', () => {\`\n\`  <commands targeting http://localhost:3500 go here>\`\n\`})`)
      //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html') // Establishes primary origin
    cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
    cy.origin('http://www.idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson')
      cy.get('[data-cy="login"]').click()
      cy.get('[data-cy="cannot_find"]') // Timeout here on command stability achieved by primary origin, this command times out.
    })

    // Verify that the user has logged in on localhost
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  it('fails with a normal timeout', { defaultCommandTimeout: 50 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms:`)
      //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      expect(err.message).not.to.include(`The command was expected to run against origin:`)
      done()
    })

    cy.visit('/fixtures/auth/index.html') // Establishes primary origin
    cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
    cy.origin('http://www.idp.com:3500', () => {
      cy.get('[data-cy="cannot_find"]') // Timeout here on command stability achieved by primary origin, this command times out.
    })
  })

  describe('Pre established spec bridge', () => {
    // These next three tests test and edge case where we want to prevent a load event from an established spec bridge that is not part of the test.
    // This test removes the foobar spec bridge, navigates to idp, then navigates to foobar and attempts to access selectors on localhost.
    it('times out in cy.origin with foobar spec bridge undefined', { defaultCommandTimeout: 50 }, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include(`Timed out retrying after 50ms:`)
        expect(err.message).to.include(`The command was expected to run against origin \`http://localhost:3500\` but the application is at origin \`http://www.foobar.com:3500\`.`)
        expect(err.message).to.include(`Using \`cy.origin()\` to wrap the commands run on \`http://www.foobar.com:3500\` will likely fix this issue.`)
        expect(err.message).to.include(`cy.origin('http://www.foobar.com:3500', () => {\`\n\`  <commands targeting http://www.foobar.com:3500 go here>\`\n\`})`)
        //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
        expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
        expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
        done()
      })

      cy.visit('/fixtures/auth/index.html') // Establishes primary origin
      cy.origin('http://www.foobar.com:3500', () => {}).then(() => {
        // Force remove the spec bridge
        window?.top?.document.getElementById('Spec Bridge: http://www.foobar.com:3500')?.remove()
      })

      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.origin('http://www.idp.com:3500', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.window().then((win) => {
          win.location.href = 'http://www.foobar.com:3500/fixtures/auth/index.html'
        })//
      })

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]') // This command times out because it's run against localhost but the aut is at foobar
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })

    // this test just needs to establish the foobar spec bridge.
    it('establishes foobar spec bridge', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes primary origin
      cy.get('[data-cy="login-foobar"]').click() // Takes you to idp.com
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.get('[data-cy="login"]').click()
      })

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })

    // This test is the same as the first test but the foobar spec bridge has been established and we expect it to behave the same as the first test.
    // The primary origin should ignore the load event from the foobar spec bridge and load should timeout in the idp cy.origin command..
    it('times out in cy.origin with foobar spec bridge defined', { defaultCommandTimeout: 50 }, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include(`Timed out retrying after 50ms:`)
        expect(err.message).to.include(`The command was expected to run against origin \`http://localhost:3500\` but the application is at origin \`http://www.foobar.com:3500\`.`)
        expect(err.message).to.include(`Using \`cy.origin()\` to wrap the commands run on \`http://www.foobar.com:3500\` will likely fix this issue.`)
        expect(err.message).to.include(`cy.origin('http://www.foobar.com:3500', () => {\`\n\`  <commands targeting http://www.foobar.com:3500 go here>\`\n\`})`)
        //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
        expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
        expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
        done()
      })

      cy.visit('/fixtures/auth/index.html') // Establishes primary origin
      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.origin('http://www.idp.com:3500', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.window().then((win) => {
          win.location.href = 'http://www.foobar.com:3500/fixtures/auth/index.html'
        })
      })

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]') // Stability is false, this command is prevented from running until stability is achieved.
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })
  })
})
