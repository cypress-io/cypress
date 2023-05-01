import { defaultMessages } from '@cy/i18n'
import ComponentTestingAvailableBanner from './ComponentTestingAvailableBanner.vue'
import { TrackedBanner_RecordBannerSeenDocument, TrackedBanner_SetProjectStateDocument } from '../../generated/graphql'
import type Sinon from 'sinon'

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
      const setPrefs = cy.stub().as('setPrefs')

      cy.stubMutationResolver(TrackedBanner_RecordBannerSeenDocument, (defineResult, event) => {
        recordEvent(event)

        return defineResult({ recordEvent: true })
      })

      cy.stubMutationResolver(TrackedBanner_SetProjectStateDocument, (defineResult, event) => {
        setPrefs(event)

        return defineResult({ __typename: 'Mutation', setPreferences: { __typename: 'Query' } as any })
      })
    })

    it('should record expected event on mount', () => {
      cy.mount(<ComponentTestingAvailableBanner hasBannerBeenShown={false} framework={{ name: 'React', type: 'react' }} />)

      cy.get('@recordEvent').should('have.been.calledWith', {
        campaign: 'TODO',
        medium: 'TODO',
        messageId: Cypress.sinon.match.string,
        cohort: null,
      })
    })

    it('should not record event on mount if already shown', () => {
      cy.mount(<ComponentTestingAvailableBanner hasBannerBeenShown={true} framework={{ name: 'React', type: 'react' }} />)

      cy.get('@recordEvent').should('not.have.been.called')
    })

    it('should record dismissal event when clicking survey link', () => {
      cy.mount(<ComponentTestingAvailableBanner hasBannerBeenShown={true} framework={{ name: 'React', type: 'react' }} />)

      cy.findByTestId('survey-link').click()

      cy.get('@setPrefs').should('have.been.calledTwice')
      cy.get('@setPrefs').should(($stub) => {
        const arg = ($stub as unknown as Sinon.SinonStub).getCall(1).args[0]

        expect(arg.value).to.contain('ct_052023_available')
        expect(arg.value).to.contain('dismissed')
      })
    })
  })
})
