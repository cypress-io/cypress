import { defaultMessages } from '@cy/i18n'
import LoginBanner from './LoginBanner.vue'

describe('<LoginBanner />', () => {
  it('should render expected content', () => {
    const copyOptions = [{ cohort: 'A', value: 'specPage.banners.login.contentA' }]

    cy.mount({ render: () => <LoginBanner modelValue={true} bodyCopyOptions={copyOptions}/> })

    cy.contains(defaultMessages.specPage.banners.login.title).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.login.contentA).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.login.buttonLabel).should('be.visible')

    cy.percySnapshot()
  })
})
