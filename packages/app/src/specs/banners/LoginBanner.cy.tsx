import { defaultMessages } from '@cy/i18n'
import LoginBanner from './LoginBanner.vue'
import { TrackedBanner_RecordBannerSeenDocument } from '../../generated/graphql'

describe('<LoginBanner />', () => {
  it('should render expected content', () => {
    const copyOptions = [{ cohort: 'A', value: 'specPage.banners.login.contentA' }]

    cy.mount({ render: () => <LoginBanner modelValue={true} bodyCopyOptions={copyOptions}/> })

    cy.contains(defaultMessages.specPage.banners.login.title).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.login.contentA).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.login.buttonLabel).should('be.visible')

    cy.percySnapshot()
  })

  it('should record expected event on mount', () => {
    const recordEvent = cy.stub().as('recordEvent')

    cy.stubMutationResolver(TrackedBanner_RecordBannerSeenDocument, (defineResult, event) => {
      recordEvent(event)

      return defineResult({ recordEvent: true })
    })

    cy.mount({ render: () => <LoginBanner modelValue={true} hasBannerBeenShown={false} /> })

    cy.get('@recordEvent').should('have.been.calledWith', {
      campaign: 'Log In',
      medium: 'Specs Login Banner',
      messageId: Cypress.sinon.match.string,
      cohort: Cypress.sinon.match.string,
    })
  })
})
