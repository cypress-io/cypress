import { initial, testIsolationBlankPage, visitFailure } from './Blank'
import { getContainerEl } from '@cypress/mount-utils'

describe('initial', () => {
  beforeEach(() => {
    getContainerEl()!.innerHTML = initial()
  })

  it('works', () => {
    cy.get('[data-cy="cypress-logo"]')

    cy.percySnapshot()
  })
})

describe('testIsolationBlankPage', () => {
  it('works', () => {
    getContainerEl()!.innerHTML = testIsolationBlankPage()

    cy.get('[data-cy="cypress-logo"]')
    cy.get('[data-cy="text"]').should('have.text', 'Default blank page')
    cy.get('[data-cy="subtext"]').should('have.text', 'This page was cleared by navigating to about:blank.All active session data (cookies, localStorage and sessionStorage) across all domains are cleared.')

    cy.percySnapshot()
  })

  it('works with small viewport', () => {
    cy.viewport(200, 500)
    getContainerEl()!.innerHTML = testIsolationBlankPage()

    cy.percySnapshot()
  })
})

describe('visitFailure', () => {
  it('works', () => {
    getContainerEl()!.innerHTML = visitFailure({ url: 'http://foo.cypress.io' })

    cy.percySnapshot()
  })

  it('works with details', () => {
    getContainerEl()!.innerHTML = visitFailure({ url: 'http://foo.cypress.io', status: 404, statusText: 'Not Found', contentType: 'text/html' })

    cy.percySnapshot()
  })
})
