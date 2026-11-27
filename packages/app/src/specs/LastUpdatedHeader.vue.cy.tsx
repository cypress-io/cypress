import LastUpdatedHeader from './LastUpdatedHeader.vue'

describe('<LastUpdatedHeader />', () => {
  const popperContentSelector = '.v-popper__popper--shown'

  function mountWithProps (isGitAvailable: boolean) {
    cy.mount(() => <div class="flex justify-around"><LastUpdatedHeader isGitAvailable={isGitAvailable} /></div>)
  }

  it('mounts correctly with git available', () => {
    mountWithProps(true)

    cy.findByTestId('last-updated-header').trigger('mouseenter')

    const expectedTooltipText = 'Git status of the spec files within this project'

    cy.get(popperContentSelector).should('have.text', expectedTooltipText)

    /* TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23436
      cy.percySnapshot()
    */
  })

  it('mounts correctly with git unavailable', () => {
    mountWithProps(false)

    cy.findByTestId('last-updated-header').contains('Last updated').trigger('mouseenter')

    const expectedTooltipText = 'Cypress is unable to detect git info for this project and has defaulted to showing file system data instead'

    cy.get(popperContentSelector).should('have.text', expectedTooltipText)
  })

  it('delays popping tooltip', () => {
    cy.clock()
    mountWithProps(true)
    cy.findByTestId('last-updated-header').trigger('mouseenter')
    cy.get(popperContentSelector).should('not.exist')
    cy.tick(500)
    cy.get(popperContentSelector).should('be.visible')
  })
})
