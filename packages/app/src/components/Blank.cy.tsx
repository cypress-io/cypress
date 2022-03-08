import { initial, session, sessionLifecycle } from './Blank'
import { ROOT_ID } from '@cypress/mount-utils'

describe('initial', () => {
  it('works', () => {
    const root = document.getElementById(ROOT_ID)!

    root.innerHTML = initial()

    cy.percySnapshot()
  })

  // TODO: move this test to the CT version, since that's where it matters the most
  it('works with small viewport', () => {
    cy.viewport(200, 1000)
    const root = document.getElementById(ROOT_ID)!

    root.innerHTML = initial()

    cy.percySnapshot()
  })
})

describe('session', () => {
  it('works', () => {
    const root = document.getElementById(ROOT_ID)!

    root.innerHTML = session()

    cy.percySnapshot()
  })
})

describe('sessionLifecycle', () => {
  it('works', () => {
    const root = document.getElementById(ROOT_ID)!

    root.innerHTML = sessionLifecycle()

    cy.percySnapshot()
  })
})
