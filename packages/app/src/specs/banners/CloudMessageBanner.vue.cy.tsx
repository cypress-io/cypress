// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import CloudMessageBanner from './CloudMessageBanner.vue'
import {
  TrackedBanner_RecordBannerSeenDocument,
  TrackedBanner_RecordBannerDismissedDocument,
  TrackedBanner_SetProjectStateDocument,
  TrackedBanner_SetGlobalStateDocument,
  UseRecordEvent_RecordEventDocument,
  ExternalLink_OpenExternalDocument,
} from '../../generated/graphql'
import type Sinon from 'sinon'

const baseMessage = {
  __typename: 'CloudAppMessage' as const,
  id: 'ai_tools_education',
  enabled: true,
  priority: 50,
  visualStyle: 'info' as const,
  title: 'Cypress AI is here!',
  body: 'cy.prompt and Studio AI help you write tests faster.',
  ctas: [
    {
      __typename: 'CloudAppMessageCta' as const,
      id: 'learn_cy_prompt',
      text: 'Learn about cy.prompt',
      href: 'https://docs.cypress.io/api/commands/prompt',
      style: 'secondary' as const,
      utm: null,
    },
    {
      __typename: 'CloudAppMessageCta' as const,
      id: 'learn_studio_ai',
      text: 'Learn about Studio AI',
      href: 'https://docs.cypress.io/app/guides/cypress-studio',
      style: 'secondary' as const,
      utm: null,
    },
  ],
  dismissal: {
    __typename: 'CloudAppMessageDismissal' as const,
    scope: 'user' as const,
  },
  analytics: {
    __typename: 'CloudAppMessageAnalytics' as const,
    campaign: 'ai_tools_education_2026q2',
    category: 'educational',
    utm: null,
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

  it('renders without an icon for info severity', () => {
    cy.mount(<CloudMessageBanner hasBannerBeenShown={true} message={baseMessage} />)
    cy.findByTestId('alert-prefix-icon').should('not.exist')
  })

  it('renders the warning icon for warning severity', () => {
    cy.mount(
      <CloudMessageBanner
        hasBannerBeenShown={true}
        message={{ ...baseMessage, visualStyle: 'warning' }}
      />,
    )

    cy.findByTestId('alert-prefix-icon').should('be.visible')
  })

  it('renders body markdown as bold / italic / links', () => {
    const messageWithMarkdown = {
      ...baseMessage,
      body: 'Stop **writing** every command. Use *Studio AI* to [generate assertions](https://docs.cypress.io).',
    }

    cy.mount(<CloudMessageBanner hasBannerBeenShown={true} message={messageWithMarkdown} />)

    cy.findByTestId('cloud-message-banner-body').within(() => {
      cy.contains('strong', 'writing').should('be.visible')
      cy.contains('em', 'Studio AI').should('be.visible')
      cy.contains('a', 'generate assertions').should('have.attr', 'href', 'https://docs.cypress.io')
    })
  })

  it('escapes raw HTML in the body instead of rendering it', () => {
    const messageWithHtml = {
      ...baseMessage,
      body: 'Plain text with <script>alert(1)</script> and <strong>raw bold</strong>.',
    }

    cy.mount(<CloudMessageBanner hasBannerBeenShown={true} message={messageWithHtml} />)

    cy.findByTestId('cloud-message-banner-body').within(() => {
      cy.get('script').should('not.exist')
      cy.get('strong').should('not.exist')
      cy.contains('<script>alert(1)</script>').should('be.visible')
      cy.contains('<strong>raw bold</strong>').should('be.visible')
    })
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

      cy.stubMutationResolver(TrackedBanner_SetGlobalStateDocument, (defineResult, event) => {
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

    it('CTA click fires recordEvent with the same messageId as the impression', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={false} message={baseMessage} />)

      cy.get('@recordSeen').should('have.been.calledOnce')
      cy.findAllByTestId('cloud-message-cta-secondary').first().click()

      // `cy.then` (not `cy.should`) so the inner `cy.get` doesn't re-enqueue
      // on retry.
      cy.get('@recordSeen').then(($recordSeen) => {
        const seenCall = ($recordSeen as unknown as Sinon.SinonStub).getCall(0)
        const seenMessageId = seenCall.args[0].messageId

        expect(seenMessageId).to.be.a('string')

        cy.get('@recordEvent').should(($recordEvent) => {
          const clickCall = ($recordEvent as unknown as Sinon.SinonStub).getCall(0)

          expect(clickCall.args[0].messageId).to.equal(seenMessageId)
        })
      })
    })

    it('CTA click forwards only the cta id (href/text/style intentionally dropped)', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={true} message={baseMessage} />)

      cy.findAllByTestId('cloud-message-cta-secondary').first().click()

      cy.get('@recordEvent').should('have.been.calledOnce')
      cy.get('@recordEvent').should(($stub) => {
        const arg = ($stub as unknown as Sinon.SinonStub).getCall(0).args[0]

        expect(arg.medium).to.equal('Cloud Message Banner')
        expect(arg.cohort).to.equal('educational')
        expect(arg.includeMachineId).to.equal(true)
        expect(arg.payload).to.contain('"action":"click"')
        expect(arg.payload).to.contain('"cta_id":"learn_cy_prompt"')
        expect(arg.payload).to.not.contain('cta_href')
        expect(arg.payload).to.not.contain('cta_text')
        expect(arg.payload).to.not.contain('cta_style')
      })
    })

    it('CTA click opens the external link with auto-injected UTMs', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={true} message={baseMessage} />)

      cy.findAllByTestId('cloud-message-cta-secondary').first().click()

      cy.get('@openExternal').should(($stub) => {
        const url = ($stub as unknown as Sinon.SinonStub).getCall(0).args[0].url as string

        expect(url).to.match(/^https:\/\/docs\.cypress\.io\/api\/commands\/prompt\?/)
        expect(url).to.include('utm_medium=Cloud+Message+Banner')
        expect(url).to.include('utm_campaign=ai_tools_education_2026q2')
        // `utm_source` is auto-injected from running context; don't pin the value.
        expect(url).to.include('utm_source=')
      })
    })

    it('CTA click cascades UTM block — CTA-level wins over message-level, missing fields are omitted', () => {
      const messageWithUtm = {
        ...baseMessage,
        analytics: {
          ...baseMessage.analytics,
          utm: {
            __typename: 'CloudAppMessageUtm' as const,
            content: 'message-default',
            term: 'message-term',
            id: null,
          },
        },
        ctas: [
          {
            ...baseMessage.ctas[0],
            utm: {
              __typename: 'CloudAppMessageUtm' as const,
              content: 'cta-override',
              term: null,
              id: null,
            },
          },
          baseMessage.ctas[1],
        ],
      }

      cy.mount(<CloudMessageBanner hasBannerBeenShown={true} message={messageWithUtm} />)

      cy.findAllByTestId('cloud-message-cta-secondary').first().click()

      cy.get('@openExternal').should(($stub) => {
        const url = ($stub as unknown as Sinon.SinonStub).getCall(0).args[0].url as string

        // CTA-level `content` wins over message-level
        expect(url).to.include('utm_content=cta-override')
        // CTA didn't set `term` so message-level falls through
        expect(url).to.include('utm_term=message-term')
        // Neither set `id` — must not appear at all
        expect(url).not.to.include('utm_id')
      })
    })

    it('dismiss fires recordBannerDismissed with the same messageId as impression', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={false} message={baseMessage} />)

      cy.get('@recordSeen').should('have.been.calledOnce')

      // Click the × on the alert to dismiss
      cy.findByTestId('alert-suffix-icon').click()

      cy.get('@recordSeen').then(($seen) => {
        const seenMessageId = ($seen as unknown as Sinon.SinonStub).getCall(0).args[0].messageId

        cy.get('@recordDismissed').should(($dismissed) => {
          const dismissCall = ($dismissed as unknown as Sinon.SinonStub).getCall(0)

          expect(dismissCall.args[0].messageId).to.equal(seenMessageId)
          expect(dismissCall.args[0].includeMachineId).to.equal(true)
          expect(dismissCall.args[0].payload).to.contain('"action":"dismiss"')
        })
      })
    })

    it('writes lastShown on mount and dismissed on close (no shownCount counter)', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={false} message={baseMessage} />)

      cy.get('@setPrefs').should('have.been.calledOnce')
      cy.get('@setPrefs').should(($stub) => {
        const arg = ($stub as unknown as Sinon.SinonStub).getCall(0).args[0]

        expect(arg.value).to.contain('lastShown')
      })

      cy.findByTestId('alert-suffix-icon').click()

      cy.get('@setPrefs').should('have.been.calledTwice')
      cy.get('@setPrefs').should(($stub) => {
        const arg = ($stub as unknown as Sinon.SinonStub).getCall(1).args[0]

        expect(arg.value).to.contain('dismissed')
        expect(arg.value).to.not.contain('shownCount')
      })
    })
  })

  // Verifies that `dismissal.scope` actually drives mutation routing —
  // user-scoped messages persist via the global mutation, project-scoped via
  // the project mutation. The `events` block above unifies both stubs so its
  // assertions are scope-agnostic; this block keeps them separate.
  context('dismissal scope routing', () => {
    beforeEach(() => {
      const projectWrite = cy.stub().as('projectWrite')
      const globalWrite = cy.stub().as('globalWrite')

      cy.stubMutationResolver(TrackedBanner_SetProjectStateDocument, (defineResult, event) => {
        projectWrite(event)

        return defineResult({ __typename: 'Mutation', setPreferences: { __typename: 'Query' } as any })
      })

      cy.stubMutationResolver(TrackedBanner_SetGlobalStateDocument, (defineResult, event) => {
        globalWrite(event)

        return defineResult({ __typename: 'Mutation', setPreferences: { __typename: 'Query' } as any })
      })
    })

    it('user-scoped messages persist to global preferences', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={true} message={{ ...baseMessage, dismissal: { ...baseMessage.dismissal, scope: 'user' } }} />)

      cy.findByTestId('alert-suffix-icon').click()

      cy.get('@globalWrite').should('have.been.called')
      cy.get('@projectWrite').should('not.have.been.called')
    })

    it('project-scoped messages persist to project saved state', () => {
      cy.mount(<CloudMessageBanner hasBannerBeenShown={true} message={{ ...baseMessage, dismissal: { ...baseMessage.dismissal, scope: 'project' } }} />)

      cy.findByTestId('alert-suffix-icon').click()

      cy.get('@projectWrite').should('have.been.called')
      cy.get('@globalWrite').should('not.have.been.called')
    })
  })
})
