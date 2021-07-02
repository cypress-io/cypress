import ConfigFile from './ConfigFile.vue'

describe('<ConfigFile />', () => {
  it('playground', { viewportWidth: 1280, viewportHeight: 1024 }, () => {
    cy.mount(() => (
      <ConfigFile />
    ))
  })

  it('should display a copy button when in manual mode', () => {
    cy.mount(() => (
      <ConfigFile />
    ))

    cy.contains('Copy').should('not.exist')
    cy.contains('Create file manually').click()
    cy.contains('Copy').should('exist')
  })
})
