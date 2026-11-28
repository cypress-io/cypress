import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin window', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.window()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.window().should('have.property', 'top')
    })
  })

  it('.document()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.document().should('have.property', 'charset').and('eq', 'UTF-8')
    })
  })

  it('.title()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.title().should('include', 'DOM Fixture')
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

    it('.window()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.window()
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('window', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('window')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Yielded).to.be.null
      })
    })

    it('.document()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.document()
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('document', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('document')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Yielded).to.be.null
      })
    })

    it('.title()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.title()
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('title', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('title')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Yielded).to.equal('DOM Fixture')
      })
    })
  })
})

context('primary origin return (#25394)', { browser: '!webkit', retries: 0 }, () => {
  for (const mode of ['direct', 'sameorigin', 'javascript', 'redirect302'] as const) {
    it(`has Cypress at application startup after ${mode}`, () => {
      const returnUrl = `http://localhost:3500/probe-25394-return-${mode}`
      const redirectUrl = 'http://www.foobar.com:3500/probe-25394-redirect'

      cy.on('window:before:load', (win) => {
        (win as any).__beforeLoad25394 = true
      })

      cy.intercept('GET', returnUrl, {
        statusCode: 200,
        headers: { 'content-type': 'text/html' },
        body: '<!doctype html><html><head><script>window.__boot25394 = { cypress: typeof window.Cypress, marker: window.__beforeLoad25394 === true };</script></head><body><p id="returned">returned</p></body></html>',
      })

      cy.intercept('GET', redirectUrl, { statusCode: 302, headers: { location: returnUrl } })

      if (mode === 'direct') {
        cy.visit(returnUrl)
      } else if (mode === 'sameorigin') {
        cy.visit('/fixtures/primary-origin.html')
        cy.document().then((doc) => {
          doc.body.insertAdjacentHTML('beforeend', `<a id="primary-return" href="${returnUrl}">primary return</a>`)
        })

        cy.get('#primary-return').click()
      } else {
        cy.visit('/fixtures/primary-origin.html')
        cy.get('a[data-cy="dom-link"]').click()
        cy.origin('http://www.foobar.com:3500', { args: { destination: mode === 'redirect302' ? redirectUrl : returnUrl, javascript: mode === 'javascript' } }, ({ destination, javascript }) => {
          cy.document().then((doc) => {
            doc.body.innerHTML = '<a id="return-to-primary">return to primary</a>'
            const link = doc.getElementById('return-to-primary') as HTMLAnchorElement

            link.href = destination
            if (javascript) {
              link.addEventListener('click', (event) => {
                event.preventDefault()
                doc.defaultView!.location.href = destination
              })
            }
          })

          cy.get('#return-to-primary').click()
        })
      }

      cy.location('href').should('eq', returnUrl)
      cy.get('#returned').should('have.text', 'returned')
      cy.window().then((win) => {
        const boot = (win as any).__boot25394

        expect({ boot, currentCypress: typeof (win as any).Cypress, currentMarker: (win as any).__beforeLoad25394 === true }, 'startup and post-navigation observations').to.deep.eq({ boot: { cypress: 'object', marker: true }, currentCypress: 'object', currentMarker: true })
      })
    })
  }
})
