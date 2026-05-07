// E2E coverage for the cloud-driven app messaging banner. Component tests
// (CloudMessageBanner.cy.tsx, SpecsListBanners.cy.tsx) cover rendering and
// event-shape assertions in isolation; this spec exercises the actual
// GraphQL stitching path — `cloudAppMessages` is a remote field on the
// test-runner schema, fetched from cypress-services via `executeRemoteGraphQL`.
// Without this test, the wiring between the binary's local query and the
// cloud resolver is exercised only at deploy time.

const cloudMessage = {
  __typename: 'CloudAppMessage',
  id: 'ai_tools_education',
  enabled: true,
  priority: 50,
  visualStyle: 'info',
  title: 'Cypress AI is here!',
  body: 'cy.prompt and Studio AI help you write tests faster.',
  ctas: [
    {
      __typename: 'CloudAppMessageCta',
      text: 'Learn about cy.prompt',
      href: 'https://docs.cypress.io/api/commands/prompt',
      style: 'secondary',
    },
    {
      __typename: 'CloudAppMessageCta',
      text: 'Learn about Studio AI',
      href: 'https://docs.cypress.io/app/guides/cypress-studio',
      style: 'secondary',
    },
  ],
  dismissal: {
    __typename: 'CloudAppMessageDismissal',
    scope: 'user',
  },
  analytics: {
    __typename: 'CloudAppMessageAnalytics',
    campaign: 'ai_tools_education_2026q2',
    category: 'educational',
  },
}

// `cloudAppMessages` is a stitched remote field. The binary's
// `CloudDataSource.makeOperationName` produces names of the shape
// `<rootOp>_cloudAppMessages`, but we don't pin to that shape — the test
// schema (`stubCloudTypes.ts`) doesn't define a resolver for the field, so
// `execute()` returns a non-null-field error and a null `data`. We
// therefore detect cloudAppMessages requests by inspecting the parsed
// document, and then return a wholesale-replacement result so the
// upstream errors don't leak into urql's cache and suppress the banner.
function stubCloudAppMessages (messages: typeof cloudMessage[] | []) {
  cy.remoteGraphQLIntercept((obj, _testState, options) => {
    const queryString = typeof obj.query === 'string' ? obj.query : ''
    const isCloudAppMessagesOp =
      obj.operationName?.includes('cloudAppMessages') ||
      queryString.includes('cloudAppMessages')

    if (isCloudAppMessagesOp) {
      obj.result.data = { cloudAppMessages: options.messages }

      return obj.result
    }

    return obj.result
  }, { messages })
}

Cypress.on('window:before:load', (win) => {
  win.__CYPRESS_GQL_NO_SOCKET__ = 'true'
})

describe('App - Cloud Message Banner', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')

    // Pre-empt `startAppServer`'s default `getCurrentProjectSavedState` stub,
    // which sets `banners._disabled = true` to suppress every banner during
    // E2E. The cloud-message orchestrator honors that flag, so without this
    // override the cloud banner never renders. We mirror the original mock
    // (firstOpened / lastOpened / promptsShown to silence the CI prompt) but
    // omit the `_disabled` flag so cloud messages can surface.
    cy.withCtx((ctx, { sinon }) => {
      sinon.stub(ctx._apis.projectApi, 'getCurrentProjectSavedState').resolves({
        firstOpened: 1609459200000,
        lastOpened: 1609459200000,
        promptsShown: { ci1: 1609459200000 },
      })
    })

    cy.startAppServer()
  })

  it('renders a cloud message returned by the channel with title, body, and both CTAs', () => {
    cy.loginUser()
    stubCloudAppMessages([cloudMessage])

    cy.visitApp()
    cy.specsPageIsVisible()

    cy.findByTestId('cloud-message-banner').should('be.visible').within(() => {
      cy.contains(cloudMessage.title).should('be.visible')
      cy.contains(cloudMessage.body).should('be.visible')
      cy.findAllByTestId('cloud-message-cta-secondary').should('have.length', 2)
      cy.contains('Learn about cy.prompt').should('be.visible')
      cy.contains('Learn about Studio AI').should('be.visible')
    })
  })

  it('dismisses on close click and persists the dismissal via setPreferences', () => {
    cy.loginUser()
    stubCloudAppMessages([cloudMessage])

    // We assert via the mutation payload (rather than re-reading savedState)
    // because `beforeEach` stubs `getCurrentProjectSavedState`, which would
    // shadow whatever the dismissal writes back. The payload is the source
    // of truth here: it's exactly what gets persisted to disk.
    cy.intercept('mutation-TrackedBanner_SetProjectState').as('setPrefs')

    cy.visitApp()
    cy.specsPageIsVisible()

    cy.findByTestId('cloud-message-banner').should('be.visible')

    // First `setPreferences` call fires from `onMounted` with `lastShown`.
    cy.wait('@setPrefs').then((interception) => {
      // Cypress auto-parses JSON request bodies, so `body` is already an object.
      const body = interception.request.body as { variables: { value: string } }
      const value = body.variables.value

      expect(value).to.contain('lastShown')
    })

    cy.findByTestId('alert-suffix-icon').click()
    cy.findByTestId('cloud-message-banner').should('not.exist')

    // Second `setPreferences` call fires from the dismissal — must include
    // a `dismissed` timestamp under the cloud-namespaced key so future
    // eligibility checks suppress the banner. v1 is "show once, then
    // never": no shownCount counter, no cooldown, no max-dismissal cap.
    cy.wait('@setPrefs').then((interception) => {
      // Cypress auto-parses JSON request bodies, so `body` is already an object.
      const body = interception.request.body as { variables: { value: string } }
      const value = body.variables.value

      expect(value).to.contain('"banners"')
      expect(value).to.contain('"cloud:ai_tools_education"')
      expect(value).to.contain('"dismissed"')
      expect(value).to.not.contain('shownCount')
    })
  })

  it('falls through to onboarding banners when the channel returns an empty manifest', () => {
    // No login → logged-out cohort would normally show the LoginBanner.
    // Asserting it still appears proves the empty-manifest case doesn't
    // short-circuit the orchestrator.
    stubCloudAppMessages([])

    cy.visitApp()
    cy.specsPageIsVisible()

    cy.findByTestId('cloud-message-banner').should('not.exist')
    cy.findByTestId('login-banner').should('be.visible')
  })

  it('cloud message wins over onboarding banners when both are eligible', () => {
    // No `cy.loginUser()` — the logged-out state would normally render the
    // LoginBanner. With a cloud message in the manifest, the cloud banner
    // must take precedence (per product spec, 2026-05-05 standup: cloud
    // message outranks all onboarding banners).
    stubCloudAppMessages([cloudMessage])

    cy.visitApp()
    cy.specsPageIsVisible()

    cy.findByTestId('cloud-message-banner').should('be.visible').contains(cloudMessage.title)
    cy.findByTestId('login-banner').should('not.exist')
  })
})
