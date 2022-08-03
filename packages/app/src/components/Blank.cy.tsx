import { initial, session, sessionLifecycle, visitFailure } from './Blank'
import { getContainerEl } from '@cypress/mount-utils'

describe('initial', () => {
  beforeEach(() => {
    getContainerEl()!.innerHTML = initial()
  })

  it('works', () => {
    cy.percySnapshot()
  })
})

describe('session', () => {
  it('works', () => {
    getContainerEl()!.innerHTML = session()

    cy.percySnapshot()
  })

  it('works with small viewport', () => {
    cy.viewport(200, 500)
    getContainerEl()!.innerHTML = session()

    cy.percySnapshot()
  })
})

describe('sessionLifecycle', () => {
  it('works', () => {
    getContainerEl()!.innerHTML = sessionLifecycle()

    cy.percySnapshot()
  })

  it('works with small viewport', () => {
    cy.viewport(200, 500)
    getContainerEl()!.innerHTML = sessionLifecycle()

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
