import { initial, initialCT, session, sessionLifecycle, visitFailure } from './Blank'
import { getContainerEl } from '@cypress/mount-utils'

describe('initial - e2e', () => {
  beforeEach(() => {
    getContainerEl()!.innerHTML = initial()
  })

  it('works', () => {
    cy.percySnapshot()
  })

  it('links to docs', () => {
    cy.contains('cy.visit').should('have.attr', 'href', 'https://on.cypress.io/visit')
  })
})

describe('initial - ct', () => {
  it('works', () => {
    getContainerEl()!.innerHTML = initialCT()

    cy.percySnapshot()
  })

  it('links to docs', () => {
    getContainerEl()!.innerHTML = initialCT()

    cy.contains('mount').should('have.attr', 'href', 'https://on.cypress.io/mount')
  })

  it('works with small viewport', () => {
    cy.viewport(200, 1000)
    getContainerEl()!.innerHTML = initial()

    cy.percySnapshot()
  })
})

describe('session', () => {
  it('works', () => {
    getContainerEl()!.innerHTML = session()

    cy.percySnapshot()
  })
})

describe('sessionLifecycle', () => {
  it('works', () => {
    getContainerEl()!.innerHTML = sessionLifecycle()

    cy.get('.warn').contains('experimentalSessionSupport')

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
