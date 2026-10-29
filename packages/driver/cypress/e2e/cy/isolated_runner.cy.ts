// Isolated-runner spike, run with cypress.config-isolatedRunner.ts: the runner
// stays on Cypress's own origin and every AUT is cross-origin to it.
const ORIGINS = {
  'localhost AUT': 'http://localhost:3500',
  'www.foobar.com AUT': 'http://www.foobar.com:3500',
}

const PAGE = '/fixtures/remote-driver-isolation.html'

describe('isolated runner', { browser: { family: 'chromium' }, defaultCommandTimeout: 2000 }, () => {
  Object.entries(ORIGINS).forEach(([label, origin]) => {
    describe(label, () => {
      beforeEach(() => {
        cy.visit(`${origin}${PAGE}`)
      })

      it('keeps the top frame on its own origin', () => {
        cy.url().should('eq', `${origin}${PAGE}`)
        cy.then(() => {
          cy.task('log', `${origin} runs under runner ${window.top!.location.origin}`)
          expect(window.top!.location.origin).not.to.eq(origin)
        })
      })

      it('runs queries, actions and assertions', () => {
        cy.get('#page').should('have.text', '1')
        cy.get('#nav').click()
        cy.get('#page').should('have.text', '2')
      })

      it('the app cannot read the top frame', () => {
        cy.get('#read-top').click()
        cy.get('#probe-result').should('have.text', 'blocked:SecurityError')
      })

      it('the app has no Cypress injection', () => {
        cy.get('body').should('have.attr', 'data-cypress', 'false')
      })

      it('a server-set SameSite=Lax cookie reaches the app', () => {
        cy.get('#cookie-login').click()
        cy.contains('h1', 'Redirecting bob')
      })

      it('the app\'s own fetch sends the login cookie', () => {
        cy.get('#cookie-login').click()
        cy.contains('h1', 'Redirecting bob')
        cy.get('#page', { timeout: 5000 }).should('have.text', '1')
        cy.get('#fetch-cookie').click()
        cy.get('#probe-result').should('have.text', 'fetch-cookie:sent')
      })

      it('document.cookie round-trips', () => {
        cy.get('#js-cookie').click()
        cy.get('#probe-result').should('have.text', 'cookie:true')
      })

      it('cy.getCookie sees a cookie the app set', () => {
        cy.get('#js-cookie').click()
        cy.getCookie('js').should('have.property', 'value', '1')
      })

      it('localStorage works', () => {
        cy.get('#storage').click()
        cy.get('#probe-result').should('have.text', 'storage:stored')
      })

      it('uncaught app error reaches uncaught:exception', () => {
        const errors: string[] = []

        cy.on('uncaught:exception', (err) => {
          errors.push(err.message)

          return false
        })

        cy.get('#throw').click()
        cy.wrap(errors).should((e) => expect(e.join()).to.include('app boom'))
      })

      it('cy.reload and cy.go', () => {
        cy.get('#nav').click()
        cy.get('#page').should('have.text', '2')
        cy.go('back')
        cy.get('#page').should('have.text', '1')
        cy.reload()
        cy.get('#page').should('have.text', '1')
      })

      it('cy.visit onBeforeLoad / onLoad get the window', () => {
        const seen: string[] = []

        cy.visit(`${origin}${PAGE}?page=3`, {
          onBeforeLoad (win) {
            seen.push(`before:${typeof (win as any).document}`)
          },
          onLoad (win) {
            seen.push(`load:${typeof (win as any).appState}`)
          },
        })

        cy.wrap(seen).should('deep.equal', ['before:object', 'load:object'])
      })
    })
  })

  it('visits several origins in one test without cy.origin', () => {
    cy.visit(`${ORIGINS['localhost AUT']}${PAGE}`)
    cy.get('#page').should('have.text', '1')
    cy.visit(`${ORIGINS['www.foobar.com AUT']}${PAGE}?page=2`)
    cy.get('#page').should('have.text', '2')
    cy.url().should('include', 'www.foobar.com')
    cy.visit(`${ORIGINS['localhost AUT']}${PAGE}?page=3`)
    cy.get('#page').should('have.text', '3')
  })
})
