import { defaultMessages } from '@cy/i18n'
import ConnectProjectBanner from './ConnectProjectBanner.vue'

describe('<ConnectProjectBanner />', () => {
  it('should render expected content', () => {
    cy.mount({ render: () => <ConnectProjectBanner modelValue={true} /> })

    cy.contains(defaultMessages.specPage.banners.connectProject.title).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.connectProject.content).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.connectProject.buttonLabel).should('be.visible')

    cy.percySnapshot()
  })
})
