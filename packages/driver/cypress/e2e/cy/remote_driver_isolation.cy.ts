// Isolation spike: each probe expects same-origin behavior. Run under the legacy
// driver same-origin (validates the probe), the remote driver same-origin, and
// the remote driver against a cross-origin AUT with no parent.Cypress access.
type Go = () => void

const SAME_ORIGIN_URL = '/fixtures/remote-driver-isolation.html'

const goSameOrigin: Go = () => {
  cy.visit(SAME_ORIGIN_URL)
}

const goCrossOrigin: Go = () => {
  cy.visit('/fixtures/remote-driver.html')
  cy.get('#isolation-link').click()
  cy.get('#page').should('have.text', '1')
}

const probes = (go: Go) => {
  describe('0 sanity', () => {
    it('AUT has no window.Cypress of its own', () => {
      go()
      cy.get('body').should('have.attr', 'data-cypress', 'false')
    })
  })

  describe('1 injection', () => {
    it('window:before:load fires for the AUT', () => {
      const urls: string[] = []

      cy.on('window:before:load', (win) => {
        try {
          urls.push(win.location.href)
        } catch (err) {
          urls.push(`unreadable: ${(err as Error).name}`)
        }
      })

      go()
      cy.wrap(urls).should((u) => expect(u.join()).to.include('remote-driver-isolation.html'))
    })

    it('window:load fires for the AUT', () => {
      const urls: string[] = []

      cy.on('window:load', (win) => {
        try {
          urls.push(win.location.href)
        } catch (err) {
          urls.push(`unreadable: ${(err as Error).name}`)
        }
      })

      go()
      cy.wrap(urls).should((u) => expect(u.join()).to.include('remote-driver-isolation.html'))
    })

    it('cy.clock/tick controls app timers', () => {
      go()
      cy.clock()
      cy.get('#delayed').click()
      cy.tick(10000)
      cy.get('#delayed-result').should('have.text', 'done')
    })
  })

  describe('2 listeners', () => {
    it('uncaught app error reaches uncaught:exception', () => {
      const errors: string[] = []

      cy.on('uncaught:exception', (err) => {
        errors.push(err.message)

        return false
      })

      go()
      cy.get('#throw').click()
      cy.wrap(errors).should((e) => expect(e.join()).to.include('app boom'))
    })

    it('unhandled rejection reaches uncaught:exception', () => {
      const errors: string[] = []

      cy.on('uncaught:exception', (err) => {
        errors.push(err.message)

        return false
      })

      go()
      cy.get('#reject').click()
      cy.wrap(errors).should((e) => expect(e.join()).to.include('app rejection'))
    })

    it('waits for a page load triggered by a click', () => {
      go()
      cy.get('#nav').click()
      cy.get('#page').should('have.text', '2')
    })

    it('cy.reload', () => {
      go()
      cy.reload()
      cy.get('#page').should('have.text', '1')
    })

    it('cy.go back', () => {
      go()
      cy.get('#nav').click()
      cy.get('#page').should('have.text', '2')
      cy.go('back')
      cy.get('#page').should('have.text', '1')
    })
  })

  describe('3 driver reads of the AUT', () => {
    it('cy.title / url / location / hash', () => {
      go()
      cy.title().should('eq', 'Isolation spike')
      cy.url().should('include', 'remote-driver-isolation.html')
      cy.location('pathname').should('eq', '/fixtures/remote-driver-isolation.html')
      cy.hash().should('eq', '')
    })

    it('cy.window / cy.document', () => {
      go()
      cy.window().should('have.property', 'appState')
      cy.document().its('title').should('eq', 'Isolation spike')
    })

    it('cy.focused after click', () => {
      go()
      cy.get('#focus-me').click()
      cy.focused().should('have.id', 'focus-me')
    })

    it('.focus / .blur', () => {
      go()
      cy.get('#focus-me').focus().should('be.focused').blur().should('not.be.focused')
    })

    it('.check / .uncheck', () => {
      go()
      cy.get('#agree').check().should('be.checked').uncheck().should('not.be.checked')
    })

    it('.select', () => {
      go()
      cy.get('#fruit').select('banana').should('have.value', 'banana')
    })

    it('.clear', () => {
      go()
      cy.get('#focus-me').clear().should('have.value', '')
    })

    it('.dblclick / .rightclick / .trigger', () => {
      go()
      cy.get('#dbl').dblclick()
      cy.get('#event-result').should('have.text', 'dblclick')
      cy.get('#right').rightclick()
      cy.get('#event-result').should('have.text', 'contextmenu')
      cy.get('#hover').trigger('mouseover')
      cy.get('#event-result').should('have.text', 'mouseover')
    })

    it('.scrollIntoView / cy.scrollTo', () => {
      go()
      cy.get('#far').scrollIntoView().should('be.visible')
      cy.scrollTo('bottom')
      cy.get('#bottom').should('be.visible')
    })

    it('.within / .parent / .filter', () => {
      go()
      cy.get('#scroller').within(() => {
        cy.get('#far').should('have.text', 'Far away')
      })

      cy.get('#far').parent().should('have.id', 'scroller')
      cy.get('button').filter('#dbl').should('have.text', 'Double')
    })

    it('.its / .invoke', () => {
      go()
      cy.get('button').its('length').should('be.greaterThan', 3)
      cy.get('#dbl').invoke('text').should('eq', 'Double')
    })

    it('should have.css', () => {
      go()
      cy.get('#scroller').should('have.css', 'overflow', 'auto')
    })

    it('cy.viewport', () => {
      go()
      cy.viewport(500, 400)
      cy.get('#dbl').should('be.visible')
    })

    it('cy.screenshot / element screenshot', () => {
      go()
      cy.screenshot('isolation-page', { capture: 'viewport' })
      cy.get('#dbl').screenshot('isolation-element')
    })

    it('cy.intercept + cy.wait', () => {
      go()
      cy.intercept('/fixtures/remote-driver-isolation.html?fetched=1').as('fetched')
      cy.get('#fetch').click()
      cy.wait('@fetched')
      cy.get('#fetch-result').should('have.text', 'status:200')
    })
  })

  describe('4 runner UI', () => {
    it('query logs carry a DOM snapshot and element count', () => {
      const logs: any[] = []

      cy.on('log:added', (attrs, log) => {
        logs.push(log)
      })

      go()
      cy.get('#dbl').should('exist').then(() => {
        const getLog = logs.filter((log) => log.get('name') === 'get' && log.get('message') === '#dbl').pop()

        expect(getLog, 'get log').to.exist
        expect(getLog.get('numElements'), 'numElements').to.eq(1)
        expect(getLog.get('snapshots')?.length ?? 0, 'snapshots').to.be.greaterThan(0)
      })
    })
  })

  describe('5 live objects in spec code', () => {
    it('cy.window().then reads app state', () => {
      go()
      cy.get('#dbl').click()
      cy.window().then((win: any) => {
        expect(win.appState.clicks).to.eq(1)
      })
    })

    it('cy.stub on an app object', () => {
      go()
      cy.window().then((win) => {
        cy.stub(win.console, 'log').as('log')
      })
    })

    it('.then($el) yields a DOM element', () => {
      go()
      cy.get('#dbl').then(($el) => {
        expect(Cypress.dom.isElement($el)).to.be.true
        expect($el[0].tagName).to.eq('BUTTON')
      })
    })

    it('.should(callback) receives jQuery', () => {
      go()
      cy.get('#dbl').should(($el) => {
        expect($el.text()).to.eq('Double')
      })
    })

    it('element alias reuse', () => {
      go()
      cy.get('#dbl').as('dbl')
      cy.get('@dbl').should('have.text', 'Double')
    })

    it('cy.wrap of a yielded element', () => {
      go()
      cy.get('#dbl').then(($el) => {
        cy.wrap($el).should('have.text', 'Double')
      })
    })
  })
}

describe('isolation spike', { browser: { family: 'chromium' }, defaultCommandTimeout: 2000 }, () => {
  describe('legacy driver, same-origin', { experimentalRemoteDriver: false }, () => probes(goSameOrigin))

  describe('remote driver, same-origin', { experimentalRemoteDriver: true }, () => probes(goSameOrigin))

  describe('remote driver, cross-origin', { experimentalRemoteDriver: true }, () => probes(goCrossOrigin))
})

export {}
