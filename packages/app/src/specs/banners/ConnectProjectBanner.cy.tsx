import { defaultMessages } from '@cy/i18n'
import ConnectProjectBanner from './ConnectProjectBanner.vue'

describe('<ConnectProjectBanner />', () => {
  it('should render expected content', () => {
    const copyOptions = [{ cohort: 'A', value: 'specPage.banners.connectProject.contentA' }]

    cy.mount({ render: () => <ConnectProjectBanner modelValue={true} bodyCopyOptions={copyOptions}/> })

    cy.contains(defaultMessages.specPage.banners.connectProject.title).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.connectProject.contentA).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.connectProject.buttonLabel).should('be.visible')

    cy.percySnapshot()
  })
})
