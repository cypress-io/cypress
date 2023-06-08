import OptOutModal from './OptOutModal.vue'

describe('<OptOutModal/>', { viewportWidth: 1119 }, () => {
  it('Displays additional text when renaming folder', () => {
    cy.mount(() => <OptOutModal hasCustomIntegrationFolder={false} />)
    cy.contains('I may need to change my').should('not.exist')

    cy.findByText('Rename folder only.').click()
    cy.contains('I may need to change my').should('be.visible')
  })

  it('shows correct text with hasCustomIntegrationFolder', () => {
    cy.mount(() => <OptOutModal hasCustomIntegrationFolder={true} />)
    cy.findByText('Don\'t rename anything — keep what I have.').should('be.visible')
    cy.percySnapshot()
  })
})
