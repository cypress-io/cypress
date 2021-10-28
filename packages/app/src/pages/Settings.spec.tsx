import Settings from './Settings.vue'

describe('<Settings />', () => {
  it('renders', () => {
    cy.viewport(900, 800)
    cy.mount(() => <Settings />)

    cy.contains('Project Settings').click()
  })
})
