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
describe('errors', { experimentalSessionSupport: true }, () => {
  it('never calls switchToDomain', { pageLoadTimeout: 5000 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out after waiting \`5000ms\` for your remote page to load on origin(s):`)
      expect(err.message).to.include(`\n- \`http://localhost:3500\`\n`)
      expect(err.message).to.include(`Your page did not fire its \`load\` event within \`5000ms\`.`)
      expect(err.message).to.include(`A cross origin request for \`http://www.foobar.com:3500/fixtures/auth/idp.html?redirect=http%3A%2F%2Flocalhost%3A3500%2Ffixtures%2Fauth%2Findex.html\` was detected.`)
      expect(err.message).to.include(`A command that triggers cross origin navigation must be immediately followed by a \`cy.switchToDomain()\` command:`)
      expect(err.message).to.include(`\`\ncy.switchToDomain(\'http://foobar.com:3500\', () => {\n  <commands targeting http://www.foobar.com:3500 go here>\n})\n\``)
      expect(err.message).to.include(`If the cross origin request was an intermediary state, you can try increasing the \`pageLoadTimeout\` value in \`cypress.json\` to wait longer`)

      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-foobar"]').click() // Timeout on page load here, we never reach the expected domain
    cy.get('[data-cy="login-foobar"]')
  })

  it('never redirects to the subdomain', { defaultCommandTimeout: 50 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms: Expected to find element: \`[data-cy="username"]\`, but never found it`)
      //  make sure that the secondary domain failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-idp"]')
    cy.switchToDomain('http://idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson') // Timeout here on command, cannot find element
      cy.get('[data-cy="login"]').click()
    })

    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  it('redirects to the wrong subdomain', { pageLoadTimeout: 5000 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out after waiting \`5000ms\` for your remote page to load on origin(s):`)
      expect(err.message).to.include(`\n- \`http://idp.com:3500\`\n`)
      expect(err.message).to.include(`A cross origin request for \`http://www.foobar.com:3500/fixtures/auth/idp.html?redirect=http%3A%2F%2Flocalhost%3A3500%2Ffixtures%2Fauth%2Findex.html\` was detected.`)
      expect(err.message).to.include(`\`\ncy.switchToDomain(\'http://foobar.com:3500\', () => {\n  <commands targeting http://www.foobar.com:3500 go here>\n})\n\``)

      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-foobar"]').click() // Timeout on page load here, we never reach the expected domain
    cy.switchToDomain('http://idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson')
      cy.get('[data-cy="login"]').click()
    })

    // Verify that the user has logged in on localhost
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  it('never returns to the primary domain', { defaultCommandTimeout: 50 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms: Expected to find element: \`[data-cy="welcome"]\`, but never found it`)
      //  make sure that the secondary domain failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-idp"]').click()
    cy.switchToDomain('http://idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson')
    }) // switchToDomain is stable so the command exits

    // Verify that the user has logged in on localhost
    cy.get('[data-cy="welcome"]') // Timeout here on command, cannot find element
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  it('redirects to an unexpected subdomain', { pageLoadTimeout: 5000 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out after waiting \`5000ms\` for your remote page to load on origin(s):`)
      expect(err.message).to.include(`\n- \`http://localhost:3500\`\n`)
      expect(err.message).to.include(`A cross origin request for \`http://www.foobar.com:3500/fixtures/auth/index.html\` was detected.`)
      expect(err.message).to.include(`\`\ncy.switchToDomain(\'http://foobar.com:3500\', () => {\n  <commands targeting http://www.foobar.com:3500 go here>\n})\n\``)

      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-idp"]').click()
    cy.switchToDomain('http://idp.com:3500', () => {
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

  it('redirects to an unexpected subdomain and calls another command in the switchToDomain command', { pageLoadTimeout: 5000 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out after waiting \`5000ms\` for your remote page to load on origin(s):`)
      expect(err.message).to.include(`\n- \`http://idp.com:3500\`\n`)
      expect(err.message).to.include(`A cross origin request for \`http://www.foobar.com:3500/fixtures/auth/index.html\` was detected.`)
      expect(err.message).to.include(`\`\ncy.switchToDomain(\'http://foobar.com:3500\', () => {\n  <commands targeting http://www.foobar.com:3500 go here>\n})\n\``)

      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-idp"]').click()
    cy.switchToDomain('http://idp.com:3500', () => {
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

  it('fails in switchToDomain when a command is run after we return to localhost', { defaultCommandTimeout: 50 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms: Expected to find element: \`[data-cy="cannot_find"]\`, but never found it`)
      //  make sure that the secondary domain failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
    cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
    cy.switchToDomain('http://idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson')
      cy.get('[data-cy="login"]').click()
      cy.get('[data-cy="cannot_find"]') // Timeout here on command stability achieved by primary domain, this command times out.
    })

    // Verify that the user has logged in on localhost
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  describe('Pre established spec bridge', () => {
    // These next three tests test and edge case where we want to prevent a load event from an established spec bridge that is not part of the test.
    // This test removes the foobar spec bridge, navigates to idp, then navigates to foobar and attempts to access selectors on localhost.
    it('times out in switchToDomain with foobar spec bridge undefined', { pageLoadTimeout: 5000 }, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include(`Timed out after waiting \`5000ms\` for your remote page to load on origin(s):`)
        expect(err.message).to.include(`\n- \`http://localhost:3500\`\n`)
        expect(err.message).to.include(`A cross origin request for \`http://www.foobar.com:3500/fixtures/auth/index.html\` was detected.`)
        expect(err.message).to.include(`\`\ncy.switchToDomain(\'http://foobar.com:3500\', () => {\n  <commands targeting http://www.foobar.com:3500 go here>\n})\n\``)

        expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
        expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
        done()
      })

      cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
      cy.window().then(() => {
      // Force remove the spec bridge
        window?.top?.document.getElementById('Spec Bridge: foobar.com')?.remove()
      })

      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.switchToDomain('http://idp.com:3500', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.window().then((win) => {
          win.location.href = 'http://www.foobar.com:3500/fixtures/auth/index.html'
        })//
      })

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]') // Stability is false, this command is prevented from running until stability is achieved.
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })

    // this test just needs to establish the foobar spec bridge.
    it('establishes foobar spec bridge', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
      cy.get('[data-cy="login-foobar"]').click() // Takes you to idp.com
      cy.switchToDomain('http://foobar.com:3500', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.get('[data-cy="login"]').click()
      })

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })

    // This test is the same as the first test but the foobar spec bridge has been established and we expect it to behave the same as the first test.
    // The primary domain should ignore the load event from the foobar spec bridge and load should timeout in the idp switchToDomain command..
    it('times out in switchToDomain with foobar spec bridge defined', { pageLoadTimeout: 5000 }, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include(`Timed out after waiting \`5000ms\` for your remote page to load on origin(s):`)
        expect(err.message).to.include(`\n- \`http://localhost:3500\`\n`)
        expect(err.message).to.include(`A cross origin request for \`http://www.foobar.com:3500/fixtures/auth/index.html\` was detected.`)
        expect(err.message).to.include(`\`\ncy.switchToDomain(\'http://foobar.com:3500\', () => {\n  <commands targeting http://www.foobar.com:3500 go here>\n})\n\``)

        expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
        expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
        done()
      })

      cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.switchToDomain('http://idp.com:3500', () => {
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
