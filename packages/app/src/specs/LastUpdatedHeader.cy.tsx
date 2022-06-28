import LastUpdatedHeader from './LastUpdatedHeader.vue'

import { defaultMessages } from '@cy/i18n'

describe('<LastUpdatedHeader />', () => {
  function mountWithProps (isGitAvailable: boolean) {
    cy.mount(() => <div class="flex justify-around"><LastUpdatedHeader isGitAvailable={isGitAvailable} /></div>)
  }

  it('mounts correctly with git available', () => {
    mountWithProps(true)

    cy.findByTestId('last-updated-header').trigger('mouseenter')

    const expectedTooltipText = defaultMessages.specPage.lastUpdated.tooltip.gitInfoAvailable
    .replace('{0}', defaultMessages.specPage.lastUpdated.tooltip.gitStatus)

    cy.get('.v-popper__popper--shown').should('have.text', expectedTooltipText)

    cy.percySnapshot()
  })

  it('mounts correctly with git unavailable', () => {
    mountWithProps(false)

    cy.findByTestId('last-updated-header').trigger('mouseenter')

    const expectedTooltipText = defaultMessages.specPage.lastUpdated.tooltip.gitInfoUnavailable
    .replace('{0}', defaultMessages.specPage.lastUpdated.tooltip.gitInfo)

    cy.get('.v-popper__popper--shown').should('have.text', expectedTooltipText)

    cy.percySnapshot()
  })
})
