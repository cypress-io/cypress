import { App } from '../../App'

describe('App.cy.js', () => {
  it('playground', () => {
    // cy.mount()
    cy.mount(App)
    cy.contains('app')
  })
})
