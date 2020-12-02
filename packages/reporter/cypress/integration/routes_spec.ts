import { EventEmitter } from 'events'
import { RootRunnable } from './../../src/runnables/runnables-store'

describe('routes', () => {
  let runner: EventEmitter
  let runnables: RootRunnable
  let start: Function

  beforeEach(() => {
    cy.fixture('runnables_routes').then((_runnables) => {
      runnables = _runnables
    })

    runner = new EventEmitter()

    cy.visit('/').then((win) => {
      win.render({
        runner,
        spec: {
          name: 'foo',
          absolute: '/foo/bar',
          relative: 'foo/bar',
        },
      })
    })

    start = () => {
      cy.get('.reporter').then(() => {
        runner.emit('runnables:ready', runnables)
        runner.emit('reporter:start', {})
      })

      cy.contains('http://localhost:3000') // ensure test content has loaded
    }
  })

  it('does not display if there are no routes', () => {
    runnables.tests![0].routes = []
    start()
    cy.get('.runnable-routes-region').should('not.be.visible')
  })

  describe('when there are routes', () => {
    beforeEach(() => {
      start()
    })

    it('displays header with number of routes', () => {
      cy.contains('Routes (3)').should('be.visible')
    })

    it('is collapsed by default', () => {
      cy.contains('Routes (3)').closest('.runnable-routes-region').find('table')
      .should('not.exist')
    })

    it('expands on click', () => {
      cy.contains('Routes (3)').click()
      cy.contains('Routes (3)').closest('.runnable-routes-region').find('table')
      .should('be.visible')

      cy.percySnapshot()
    })
  })

  describe('when routes are expanded', () => {
    beforeEach(() => {
      start()
      cy.contains('Routes (3)').click()
    })

    it('displays tooltip for number of routes', () => {
      cy.get('.runnable-routes-region').contains('#').trigger('mouseover')
      cy.get('.cy-tooltip')
      .should('have.text', 'Number of responses which matched this route')
    })

    it('route displays without no-responses class if numResponses is non-zero', () => {
      cy.get('.route-item').first()
      .should('not.have.class', 'no-responses')
    })

    it('route displays with no-responses class if zero numResponses', () => {
      cy.get('.route-item').eq(1)
      .should('have.class', 'no-responses')
    })

    it('route displays the method', () => {
      cy.get('.route-item .route-method').first()
      .should('have.text', 'GET')
    })

    it('route displays the url', () => {
      cy.get('.route-item .route-url').first()
      .should('have.text', '/posts')
    })

    it('route displays isStubbed as Yes if stubbed', () => {
      cy.get('.route-item .route-is-stubbed').eq(1)
      .should('have.text', 'Yes')
    })

    it('route displays isStubbed as No if not stubbed', () => {
      cy.get('.route-item .route-is-stubbed').first()
      .should('have.text', 'No')
    })

    it('route displays the alias', () => {
      cy.get('.route-item .route-alias-name').eq(2)
      .should('have.text', 'createPost')
    })

    it('route displays a Tooltip for the alias', () => {
      cy.get('.route-item .route-alias-name').eq(2).trigger('mouseover')
      cy.get('.cy-tooltip').should('have.text', `Aliased this route as: 'createPost'`)
    })

    it('route displays the numResponses if non-zero', () => {
      cy.get('.route-item .route-num-responses').first()
      .should('have.text', '2')
    })

    it('route displays the numResponses as "-" if zero', () => {
      cy.get('.route-item .route-num-responses').eq(1)
      .should('have.text', '-')
    })
  })
})
