import LastUpdatedHeader from './LastUpdatedHeader.vue'

import { defaultMessages } from '@cy/i18n'

describe('<LastUpdatedHeader />', () => {
  it('mounts correctly with git available', () => {
    cy.mount(<LastUpdatedHeader isGitAvailable/>)
    cy.findByTestId('last-updated-header').trigger('mouseenter')

    const expectedTooltipText = defaultMessages.specPage.lastUpdated.tooltip.gitInfoAvailable
    .replace('{0}', defaultMessages.specPage.lastUpdated.tooltip.gitStatus)

    cy.get('.v-popper__popper--shown').should('have.text', expectedTooltipText)

    cy.percySnapshot()
  })

  it('mounts correctly with git unavailable', () => {
    cy.mount(<LastUpdatedHeader isGitAvailable={false}/>)
    cy.findByTestId('last-updated-header').trigger('mouseenter')

    const expectedTooltipText = defaultMessages.specPage.lastUpdated.tooltip.gitInfoUnavailable
    .replace('{0}', defaultMessages.specPage.lastUpdated.tooltip.gitInfo)

    cy.get('.v-popper__popper--shown').should('have.text', expectedTooltipText)

    cy.percySnapshot()
  })
})
