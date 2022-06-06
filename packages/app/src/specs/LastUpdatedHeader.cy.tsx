import LastUpdatedHeader from './LastUpdatedHeader.vue'

import { defaultMessages } from '@cy/i18n'

describe('<LastUpdatedHeader />', () => {
  it('mounts correctly with git available', () => {
    cy.mount(<LastUpdatedHeader isGitAvailable/>)
    cy.findByTestId('last-updated-header').trigger('mouseenter')
    const tooltipText = defaultMessages.specPage.lastUpdated.tooltip.gitInfoAvailable

    const tooltipTextSplit = tooltipText.split('{0}').filter((s) => s)

    for (let i = 0; i < tooltipTextSplit.length; i++) {
      cy.get('.v-popper__popper--shown').contains(tooltipTextSplit[i])
    }
  })

  it('mounts correctly with git unavailable', () => {
    cy.mount(<LastUpdatedHeader isGitAvailable={false}/>)
    cy.findByTestId('last-updated-header').trigger('mouseenter')
    const tooltipText = defaultMessages.specPage.lastUpdated.tooltip.gitInfoUnavailable

    const tooltipTextSplit = tooltipText.split('{0}').filter((s) => s)

    for (let i = 0; i < tooltipTextSplit.length; i++) {
      cy.get('.v-popper__popper--shown').contains(tooltipTextSplit[i])
    }
  })
})
