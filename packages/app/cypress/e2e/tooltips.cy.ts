const TooltipTriggerSelector = '.v-popper'
const TooltipContentSelector = '.v-popper__popper--shown'

describe('App: Tooltips', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('e2e')
    cy.visitApp()
  })

  it('should layer beneath modals', () => {
    // Open a modal by mousing over header, will remain open
    cy.findByText('Last updated').parent(TooltipTriggerSelector).trigger('mouseenter')
    // Wait for tooltip to be visible
    cy.get(TooltipContentSelector).should('be.visible')

    // Open a modal dialog
    cy.findByTestId('new-spec-button').click()

    // Grab z-index values from tooltip and modal and ensure modal's value is greater
    cy.get(TooltipContentSelector).then((popper) => {
      const popper_zIndex = popper.css('z-index')

      cy.findByTestId('create-spec-modal').then((modal) => {
        const modal_zIndex = modal.css('z-index')

        expect(Number(modal_zIndex)).to.be.greaterThan(Number(popper_zIndex))
      })
    })

    cy.percySnapshot()
  })
})
