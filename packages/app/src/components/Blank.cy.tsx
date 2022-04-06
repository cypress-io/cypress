import { initial, initialCT, session, sessionLifecycle, visitFailure } from './Blank'
import { ROOT_SELECTOR } from '@cypress/mount-utils'

describe('initial - e2e', () => {
  beforeEach(() => {
    const root = document.querySelector(ROOT_SELECTOR)[0]!

    root.innerHTML = initial()
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
    const root = document.querySelector(ROOT_SELECTOR)[0]!

    root.innerHTML = initialCT()

    cy.percySnapshot()
  })

  it('links to docs', () => {
    const root = document.querySelector(ROOT_SELECTOR)[0]!

    root.innerHTML = initialCT()

    cy.contains('mount').should('have.attr', 'href', 'https://on.cypress.io/mount')
  })

  it('works with small viewport', () => {
    cy.viewport(200, 1000)
    const root = document.querySelector(ROOT_SELECTOR)[0]!

    root.innerHTML = initial()

    cy.percySnapshot()
  })
})

describe('session', () => {
  it('works', () => {
    const root = document.querySelector(ROOT_SELECTOR)[0]!

    root.innerHTML = session()

    cy.percySnapshot()
  })
})

describe('sessionLifecycle', () => {
  it('works', () => {
    const root = document.querySelector(ROOT_SELECTOR)[0]!

    root.innerHTML = sessionLifecycle()

    cy.get('.warn').contains('experimentalSessionSupport')

    cy.percySnapshot()
  })
})

describe('visitFailure', () => {
  it('works', () => {
    const root = document.querySelector(ROOT_SELECTOR)[0]!

    root.innerHTML = visitFailure({ url: 'http://foo.cypress.io' })

    cy.percySnapshot()
  })

  it('works with details', () => {
    const root = document.querySelector(ROOT_SELECTOR)[0]!

    root.innerHTML = visitFailure({ url: 'http://foo.cypress.io', status: 404, statusText: 'Not Found', contentType: 'text/html' })

    cy.percySnapshot()
  })
})
