// import to bind shouldWithTimeout into global cy commands
import '../../../support/utils'

describe('cy.origin - snapshots', { browser: '!webkit' }, () => {
  it('does not create snapshots after the document has unloaded and the AUT has navigated cross-origin', () => {
    cy.visit('/fixtures/generic.html')
    cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
    cy.then(() => {
      const snapshot = cy.createSnapshot()

      expect(snapshot).to.be.null
    })
  })

  it('takes snapshots from the secondary origin even after the primary AUT has been unloaded from state', () => {
    const findLog = (logMap: Map<string, any>, selector) => {
      return Array.from(logMap.values()).find((log: any) => {
        const props = log.get()

        return (props?.consoleProps?.props?.Selector === selector)
      })
    }
    let logs: Map<string, any> = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="xhr-fetch-requests-onload"]').click()

    cy.origin('http://www.foobar.com:3500', () => {
      // need to set isInteractive in the spec bridge in order to take snapshots in run mode, similar to how isInteractive is set within support/defaults.js
      // @ts-ignore
      Cypress.config('isInteractive', true)
      cy.get(`[data-cy="assertion-header"]`)
    })

    cy.shouldWithTimeout(() => {
      const getLogFromSecondaryOrigin = findLog(logs, '[data-cy="assertion-header"]')?.get()

      expect(getLogFromSecondaryOrigin).to.exist

      const snapshots = getLogFromSecondaryOrigin?.snapshots?.map((snapshot) => snapshot?.body.get()[0]) || []

      expect(snapshots.length).to.equal(1)

      expect(snapshots[0].querySelector(`[data-cy="assertion-header"]`)).to.have.property('innerText').that.equals('Making XHR and Fetch Requests behind the scenes if fireOnload is true!')
    })
  })

  describe('e2e log verification', () => {
    const findLog = (logMap: Map<string, any>, displayName: string, url: string) => {
      return Array.from(logMap.values()).find((log: any) => {
        const props = log.get()

        return props.displayName === displayName && (props?.consoleProps?.props?.URL === url || props?.consoleProps()?.props?.URL === url)
      })
    }
    let logs: Map<string, any>

    beforeEach(() => {
      logs = new Map()

      cy.on('log:changed', (attrs, log) => {
        logs.set(attrs.id, log)
      })

      cy.task('log', 'beforeEach before visit')

      cy.fixture('foo.bar.baz.json').then((fooBarBaz) => {
        cy.task('log', 'beforeEach before intercept')

        cy.intercept('GET', '/foo.bar.baz.json', { body: fooBarBaz }).as('fooBarBaz')
      })

      cy.task('log', 'beforeEach before visit')

      cy.visit('/fixtures/primary-origin.html')
      cy.task('log', 'beforeEach before get')

      cy.get('a[data-cy="xhr-fetch-requests-onload"]').click()
      cy.task('log', 'beforeEach after get')
    })

    // TODO: fix failing test: https://github.com/cypress-io/cypress/issues/23840
    // it.skip('verifies XHR requests made while a secondary origin is active eventually update with snapshots of the secondary origin', () => {
    //   cy.origin('http://www.foobar.com:3500', () => {
    //     // need to set isInteractive in the spec bridge in order to take xhr snapshots in run mode, similar to how isInteractive is set within support/defaults.js
    //     // @ts-ignore
    //     Cypress.config('isInteractive', true)
    //     cy.visit('http://www.foobar.com:3500/fixtures/xhr-fetch-requests.html')
    //     cy.get(`[data-cy="assertion-header"]`).should('exist')
    //     cy.wait('@fooBarBaz')
    //   })

    //   cy.shouldWithTimeout(() => {
    //     const xhrLogFromSecondaryOrigin = findLog(logs, 'xhr', 'http://localhost:3500/foo.bar.baz.json')?.get()

    //     expect(xhrLogFromSecondaryOrigin).to.exist

    //     const snapshots = xhrLogFromSecondaryOrigin.snapshots.map((snapshot) => snapshot.body.get()[0])

    //     expect(snapshots.length).to.equal(2)

    //     // TODO: Since we have two events, one of them does not have a request snapshot

    //     expect(snapshots[1].querySelector(`[data-cy="assertion-header"]`)).to.have.property('innerText').that.equals('Making XHR and Fetch Requests behind the scenes if fireOnload is true!')
    //   })
    // })

    // // TODO: fix failing test: https://github.com/cypress-io/cypress/issues/23840
    // it.skip('verifies fetch requests made while a secondary origin is active eventually update with snapshots of the secondary origin', () => {
    //   cy.origin('http://www.foobar.com:3500', () => {
    //     // need to set isInteractive in the spec bridge in order to take xhr snapshots in run mode, similar to how isInteractive is set within support/defaults.js
    //     // @ts-ignore
    //     Cypress.config('isInteractive', true)
    //     cy.visit('http://www.foobar.com:3500/fixtures/xhr-fetch-requests.html')
    //     cy.get(`[data-cy="assertion-header"]`).should('exist')
    //     cy.wait('@fooBarBaz')
    //   })

    //   cy.shouldWithTimeout(() => {
    //     const xhrLogFromSecondaryOrigin = findLog(logs, 'fetch', 'http://localhost:3500/foo.bar.baz.json')?.get()

    //     expect(xhrLogFromSecondaryOrigin).to.exist

    //     const snapshots = xhrLogFromSecondaryOrigin.snapshots.map((snapshot) => snapshot.body.get()[0])

    //     snapshots.forEach((snapshot) => {
    //       expect(snapshot.querySelector(`[data-cy="assertion-header"]`)).to.have.property('innerText').that.equals('Making XHR and Fetch Requests behind the scenes if fireOnload is true!')
    //     })
    //   })
    // })

    it('Does not take snapshots of XHR/fetch requests from secondary origin if the wrong origin is visited / origin mismatch, but instead the primary origin (existing behavior)', {
      defaultCommandTimeout: 50,
    },
    (done) => {
      cy.on('fail', () => {
        const xhrLogFromSecondaryOrigin = findLog(logs, 'fetch', 'http://localhost:3500/foo.bar.baz.json')?.get()

        expect(xhrLogFromSecondaryOrigin).to.exist

        const snapshots = xhrLogFromSecondaryOrigin.snapshots.map((snapshot) => snapshot.body.get()[0])

        snapshots.forEach((snapshot) => {
          expect(snapshot.querySelector(`[data-cy="assertion-header"]`)).to.be.null
        })

        done()
      })

      cy.task('log', 'test before visit')

      cy.visit('http://www.foobar.com:3500/fixtures/xhr-fetch-requests.html')

      cy.task('log', 'test after visit')

      cy.origin('http://www.barbaz.com:3500', () => {
        // need to set isInteractive in the spec bridge in order to take xhr snapshots in run mode, similar to how isInteractive is set within support/defaults.js
        // @ts-ignore
        Cypress.config('isInteractive', true)

        cy.task('log', 'test before get')

        cy.get(`[data-cy="assertion-header"]`).should('exist')

        cy.task('log', 'test after get')

        cy.wait('@fooBarBaz')

        cy.task('log', 'test after wait')
      })

      cy.task('log', 'test after origin')
    })
  })
})
