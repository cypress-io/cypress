import { defaultMessages } from '@cy/i18n'
import ComponentTestingAvailableBanner from './ComponentTestingAvailableBanner.vue'
import { TrackedBanner_RecordBannerSeenDocument } from '../../generated/graphql'

describe('<ComponentTestingBanner />', () => {
  it('should render expected content', () => {
    cy.mount(<ComponentTestingAvailableBanner hasBannerBeenShown={true} framework={{ name: 'React', type: 'react' }} />)
  })

  ;[
    { name: 'React', type: 'react' },
    { name: 'Vue', type: 'vue3' },
    { name: 'Angular', type: 'angular' },
    { name: 'Next.js', type: 'nextjs' },
  ].map((framework) => {
    it(`should render expected content for ${framework.name}`, () => {
      cy.mount(<ComponentTestingAvailableBanner hasBannerBeenShown={true} framework={framework} />)

      cy.findByTestId('framework-icon').should('be.visible')
      cy.contains(defaultMessages.specPage.banners.ct.title.replace('{0}', framework.name)).should('be.visible')
    })
  })

  context('events', () => {
    beforeEach(() => {
      const recordEvent = cy.stub().as('recordEvent')

      cy.stubMutationResolver(TrackedBanner_RecordBannerSeenDocument, (defineResult, event) => {
        recordEvent(event)

        return defineResult({ recordEvent: true })
      })
    })

    it('should record expected event on mount', () => {
      cy.mount(<ComponentTestingAvailableBanner hasBannerBeenShown={false} framework={{ name: 'React', type: 'react' }} />)

      cy.get('@recordEvent').should('have.been.calledWith', {
        campaign: 'TODO',
        medium: 'TODO',
        messageId: Cypress.sinon.match.string,
        cohort: 'n/a',
      })
    })

    it('should not record event on mount if already shown', () => {
      cy.mount(<ComponentTestingAvailableBanner hasBannerBeenShown={true} framework={{ name: 'React', type: 'react' }} />)

      cy.get('@recordEvent').should('not.have.been.called')
    })
  })
})
