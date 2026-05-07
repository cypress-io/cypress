// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import CloudMessageBanner from './CloudMessageBanner.vue'
import {
  TrackedBanner_RecordBannerSeenDocument,
  TrackedBanner_RecordBannerDismissedDocument,
  TrackedBanner_SetProjectStateDocument,
  UseRecordEvent_RecordEventDocument,
  ExternalLink_OpenExternalDocument,
} from '../../generated/graphql'
import type Sinon from 'sinon'

const baseMessage = {
  __typename: 'CloudAppMessage' as const,
  id: 'ai_tools_education',
  enabled: true,
  priority: 50,
  surface: 'specs_list_banner' as const,
  visualStyle: 'info' as const,
  title: 'Cypress AI is here!',
  body: 'cy.prompt and Studio AI help you write tests faster.',
  ctas: [
    {
      __typename: 'CloudAppMessageCta' as const,
      text: 'Learn about cy.prompt',
      href: 'https://docs.cypress.io/api/commands/prompt',
      style: 'secondary' as const,
    },
    {
      __typename: 'CloudAppMessageCta' as const,
      text: 'Learn about Studio AI',
      href: 'https://docs.cypress.io/app/guides/cypress-studio',
      style: 'secondary' as const,
    },
  ],
  dismissal: {
    __typename: 'CloudAppMessageDismissal' as const,
    scope: 'user' as const,
    cooldownDays: 0,
    maxDismissals: 1,
    rePromptOnSeverityEscalation: false,
  },
  analytics: {
    __typename: 'CloudAppMessageAnalytics' as const,
    campaign: 'ai_tools_education_2026q2',
    category: 'educational',
  },
}

describe('<CloudMessageBanner />', { viewportWidth: 1200 }, () => {
  it('renders title, body, and both CTA buttons', () => {
    cy.mount(<CloudMessageBanner hasBannerBeenShown={true} message={baseMessage} />)

    cy.contains(baseMessage.title).should('be.visible')
    cy.contains(baseMessage.body).should('be.visible')
    cy.contains('Learn about cy.prompt').should('be.visible')
    cy.contains('Learn about Studio AI').should('be.visible')
  })

  it('renders without an icon for info / educational / promotional severities', () => {
    cy.mount(<CloudMessageBanner hasBannerBeenShown={true} message={baseMessage} />)
    cy.findByTestId('alert-prefix-icon').should('not.exist')
  })

  it('renders the warning icon for warning / critical severities', () => {
    cy.mount(
      <CloudMessageBanner
        hasBannerBeenShown={true}
        message={{ ...baseMessage, visualStyle: 'critical' }}
      />,
    )

    cy.findByTestId('alert-prefix-icon').should('be.visible')
  })

  context('events', () => {
    beforeEach(() => {
      const recordSeen = cy.stub().as('recordSeen')
      const recordDismissed = cy.stub().as('recordDismissed')
      const recordEvent = cy.stub().as('recordEvent')
      const openExternal = cy.stub().as('openExternal')
      const setPrefs = cy.stub().as('setPrefs')

      cy.stubMutationResolver(TrackedBanner_RecordBannerSeenDocument, (defineResult, event) => {
        recordSeen(event)

        return defineResult({ recordEvent: true })
      })

      cy.stubMutationResolver(TrackedBanner_RecordBannerDismissedDocument, (defineResult, event) => {
        recordDismissed(event)

        return defineResult({ recordEvent: true })
      })

      cy.stubMutationResolver(UseRecordEvent_RecordEventDocument, (defineResult, event) => {
        recordEvent(event)

        return defineResult({ recordEvent: true })
      })

      cy.stubMutationResolver(ExternalLink_OpenExternalDocument, (defineResult, event) => {
        openExternal(event)

        return defineResult({ openExternal: true })
      })

      cy.stubMutationResolver(TrackedBanner_SetProjectStateDocument, (defineResult, event) => {
        setPrefs(event)

        return defineResult({ __typename: 'Mutation', setPreferences: { __typename: 'Query' } as any })
      })
    })

    it('records impression on mount with includeMachineId: true and routes via Cloud Message Banner medium', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={false} message={baseMessage} />)

      cy.get('@recordSeen').should('have.been.calledWith', {
        campaign: 'ai_tools_education_2026q2',
        medium: 'Cloud Message Banner',
        messageId: Cypress.sinon.match.string,
        cohort: 'educational',
        includeMachineId: true,
      })
    })

    it('does not record impression if hasBannerBeenShown is true', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={true} message={baseMessage} />)
      cy.get('@recordSeen').should('not.have.been.called')
    })

    it('CTA click fires recordEvent with the same messageId as the impression (warehouse join key)', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={false} message={baseMessage} />)

      // First wait for the impression event to land so we can capture its messageId.
      cy.get('@recordSeen').should('have.been.calledOnce')

      cy.findAllByTestId('cloud-message-cta-secondary').first().click()

      cy.get('@recordSeen').should(($recordSeen) => {
        const seenCall = ($recordSeen as unknown as Sinon.SinonStub).getCall(0)
        const seenMessageId = seenCall.args[0].messageId

        expect(seenMessageId).to.be.a('string')

        // Now assert the click event used the same messageId. Without the slot-scope
        // forwarding fix, the click would have minted a fresh nanoid here and the
        // join would fail.
        cy.get('@recordEvent').should(($recordEvent) => {
          const clickCall = ($recordEvent as unknown as Sinon.SinonStub).getCall(0)

          expect(clickCall.args[0].messageId).to.equal(seenMessageId)
        })
      })
    })

    it('CTA click forwards the cta payload (action, text, href, style)', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={true} message={baseMessage} />)

      cy.findAllByTestId('cloud-message-cta-secondary').first().click()

      cy.get('@recordEvent').should('have.been.calledOnce')
      cy.get('@recordEvent').should(($stub) => {
        const arg = ($stub as unknown as Sinon.SinonStub).getCall(0).args[0]

        expect(arg.medium).to.equal('Cloud Message Banner')
        expect(arg.includeMachineId).to.equal(true)
        expect(arg.payload).to.contain('"action":"click"')
        expect(arg.payload).to.contain('"cta_text":"Learn about cy.prompt"')
        expect(arg.payload).to.contain('"cta_href":"https://docs.cypress.io/api/commands/prompt"')
      })
    })

    it('CTA click also opens the external link', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={true} message={baseMessage} />)

      cy.findAllByTestId('cloud-message-cta-secondary').first().click()

      cy.get('@openExternal').should('have.been.calledWith', {
        url: 'https://docs.cypress.io/api/commands/prompt',
        includeGraphqlPort: false,
      })
    })

    it('dismiss fires recordBannerDismissed with the same messageId as impression', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={false} message={baseMessage} />)

      cy.get('@recordSeen').should('have.been.calledOnce')

      // Click the × on the alert to dismiss
      cy.findByTestId('dismiss-button').click()

      cy.get('@recordSeen').should(($seen) => {
        const seenMessageId = ($seen as unknown as Sinon.SinonStub).getCall(0).args[0].messageId

        cy.get('@recordDismissed').should(($dismissed) => {
          const dismissCall = ($dismissed as unknown as Sinon.SinonStub).getCall(0)

          expect(dismissCall.args[0].messageId).to.equal(seenMessageId)
          expect(dismissCall.args[0].includeMachineId).to.equal(true)
          expect(dismissCall.args[0].payload).to.contain('"action":"dismiss"')
          expect(dismissCall.args[0].payload).to.contain('"banner_id":"cloud:ai_tools_education"')
        })
      })
    })

    it('persists shownCount on dismissal (for maxDismissals enforcement) but not on mount', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={false} message={baseMessage} />)

      // First setPrefs call is `lastShown` from onMounted — should NOT include shownCount
      // (we deliberately count at dismissal, not mount, to avoid an unmount race).
      cy.get('@setPrefs').should('have.been.calledOnce')
      cy.get('@setPrefs').should(($stub) => {
        const arg = ($stub as unknown as Sinon.SinonStub).getCall(0).args[0]

        expect(arg.value).to.contain('lastShown')
        expect(arg.value).to.not.contain('shownCount')
      })

      cy.findByTestId('dismiss-button').click()

      // Second setPrefs call is `dismissed` — should include shownCount: 1
      cy.get('@setPrefs').should('have.been.calledTwice')
      cy.get('@setPrefs').should(($stub) => {
        const arg = ($stub as unknown as Sinon.SinonStub).getCall(1).args[0]

        expect(arg.value).to.contain('dismissed')
        expect(arg.value).to.contain('"shownCount":1')
      })
    })
  })
})
