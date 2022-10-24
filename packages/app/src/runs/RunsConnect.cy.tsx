import RunsConnect from './RunsConnect.vue'

describe('<RunsConnect />', () => {
  it('show connect button', () => {
    cy.mount(() => <div class="h-screen"><RunsConnect /></div>)

    cy.contains('button', 'Log in').should('be.visible')
  })
})
