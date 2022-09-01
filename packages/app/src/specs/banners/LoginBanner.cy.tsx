import { defaultMessages } from '@cy/i18n'
import LoginBanner from './LoginBanner.vue'

describe('<LoginBanner />', () => {
  it('should render expected content', () => {
    cy.mount({ render: () => <LoginBanner modelValue={true} /> })

    cy.contains(defaultMessages.specPage.banners.login.title).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.login.content).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.login.buttonLabel).should('be.visible')

    cy.percySnapshot()
  })
})
