// The remote driver against an AUT on baseUrl and on another site; the runner is cross-origin to
// both. Where the remote driver deviates from the legacy driver, the test asserts the deviation.
type Go = () => void

const goBaseUrl: Go = () => {
  cy.visit('/fixtures/remote-driver-isolation.html')
}

const goOtherSite: Go = () => {
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
    it('window:before:load doesn\'t fire for the AUT', () => {
      const urls: string[] = []

      cy.on('window:before:load', (win) => {
        urls.push(win.location.href)
      })

      go()
      cy.get('#page').should('have.text', '1')
      cy.wrap(urls).should('be.empty')
    })

    it('window:load fires with the cross-origin window', () => {
      const urls: string[] = []

      cy.on('window:load', (win) => {
        try {
          urls.push(win.location.href)
        } catch (err) {
          urls.push(`unreadable: ${(err as Error).name}`)
        }
      })

      go()
      cy.wrap(urls).should((u) => expect(u.join()).to.include('unreadable: SecurityError'))
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

    it('cy.window().its() yields a stand-in; cy.document().its() reads the document', () => {
      go()
      cy.window().its('appState').then((appState) => {
        expect(String(appState)).to.eq('[AUT window].appState')
      })

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
    it('query logs carry an element count and visibility but no DOM snapshot', () => {
      const logs: any[] = []

      cy.on('log:added', (attrs, log) => {
        logs.push(log)
      })

      const getLog = (selector: string) => logs.filter((log) => log.get('name') === 'get' && log.get('message') === selector).pop()

      go()
      cy.get('#dbl').should('exist')
      cy.get('button').should('have.length.greaterThan', 3)
      cy.get('#hidden').should('exist').then(() => {
        expect(getLog('#dbl').get('numElements'), '#dbl numElements').to.eq(1)
        expect(getLog('#dbl').get('visible'), '#dbl visible').to.be.true
        expect(getLog('#dbl').get('snapshots')?.length ?? 0, 'snapshots').to.eq(0)
        expect(getLog('button').get('numElements'), 'button numElements').to.be.greaterThan(3)
        expect(getLog('#hidden').get('visible'), '#hidden visible').to.be.false
      })
    })
  })

  describe('5 live objects in spec code', () => {
    it('cy.window().then yields a stand-in that can\'t read app state', () => {
      go()
      cy.get('#dbl').click()
      cy.window().then((win: any) => {
        expect(String(win.appState.clicks)).to.eq('[AUT window].appState.clicks')
      })
    })

    it('cy.stub on an app object', () => {
      go()
      cy.window().then((win) => {
        cy.stub(win.console, 'log').as('log')
      })
    })

    it('.then($el) yields a snapshot, not a DOM element', () => {
      go()
      cy.get('#dbl').then(($el) => {
        expect(Cypress.dom.isElement($el)).to.be.false
        expect($el.prop('tagName')).to.eq('BUTTON')
        expect(() => $el[0]).to.throw()
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

describe('remote driver isolation', () => {
  describe('AUT on baseUrl', () => probes(goBaseUrl))

  describe('AUT on another site', () => probes(goOtherSite))
})

export {}
