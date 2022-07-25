// import to bind shouldWithTimeout into global cy commands
import '../../../support/utils'

describe('cy.origin - snapshots', () => {
  const findLog = (logMap: Map<string, any>, displayName: string, url: string) => {
    return Array.from(logMap.values()).find((log: any) => {
      const props = log.get()

      return props.displayName === displayName && props.url === url
    })
  }
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.fixture('foo.bar.baz.json').then((fooBarBaz) => {
      cy.intercept('GET', '/foo.bar.baz.json', { body: fooBarBaz })
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="xhr-fetch-requests"]').click()
  })

  it('verifies XHR requests made while a secondary origin is active eventually update with snapshots of the secondary origin', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get(`[data-cy="assertion-header"]`).should('exist')
      // have some wait time to allow for the xhr/fetch requests to settle
      cy.wait(200)
    })

    cy.shouldWithTimeout(() => {
      const xhrLogFromSecondaryOrigin = findLog(logs, 'xhr', 'http://localhost:3500/foo.bar.baz.json')?.get()

      expect(xhrLogFromSecondaryOrigin).to.not.be.undefined

      const snapshots = xhrLogFromSecondaryOrigin.snapshots.map((snapshot) => snapshot.body.get()[0])

      snapshots.forEach((snapshot) => {
        expect(snapshot.querySelector(`[data-cy="assertion-header"]`)).to.have.property('innerText').that.equals('Making XHR and Fetch Requests behind the scenes!')
      })
    })
  })

  it('verifies fetch requests made while a secondary origin is active eventually update with snapshots of the secondary origin', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get(`[data-cy="assertion-header"]`).should('exist')
      // have some wait time to allow for the xhr/fetch requests to settle
      cy.wait(200)
    })

    cy.shouldWithTimeout(() => {
      const xhrLogFromSecondaryOrigin = findLog(logs, 'fetch', 'http://localhost:3500/foo.bar.baz.json')?.get()

      expect(xhrLogFromSecondaryOrigin).to.not.be.undefined

      const snapshots = xhrLogFromSecondaryOrigin.snapshots.map((snapshot) => snapshot.body.get()[0])

      snapshots.forEach((snapshot) => {
        expect(snapshot.querySelector(`[data-cy="assertion-header"]`)).to.have.property('innerText').that.equals('Making XHR and Fetch Requests behind the scenes!')
      })
    })
  })

  it('Does not take snapshots of XHR/fetch requests from secondary origin if the wrong origin is / origin mismatch, but instead the primary origin (existing behavior)', {
    pageLoadTimeout: 5000,
  },
  (done) => {
    cy.on('fail', () => {
      const xhrLogFromSecondaryOrigin = findLog(logs, 'fetch', 'http://localhost:3500/foo.bar.baz.json')?.get()

      expect(xhrLogFromSecondaryOrigin).to.not.be.undefined

      const snapshots = xhrLogFromSecondaryOrigin.snapshots.map((snapshot) => snapshot.body.get()[0])

      snapshots.forEach((snapshot) => {
        expect(snapshot.querySelector(`[data-cy="assertion-header"]`)).to.be.null
      })

      done()
    })

    cy.origin('http://barbaz.com:3500', () => {
      cy.get(`[data-cy="assertion-header"]`).should('exist')
      // have some wait time to allow for the xhr/fetch requests to settle
      cy.wait(200)
    })
  })
})
