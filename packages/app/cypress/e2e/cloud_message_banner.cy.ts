// Exercises the GraphQL stitching path that component tests can't reach —
// `cloudAppMessages` is a remote field fetched from cypress-services.

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
      id: 'learn_cy_prompt',
      text: 'Learn about cy.prompt',
      href: 'https://docs.cypress.io/api/commands/prompt',
      style: 'secondary',
      utm: null,
    },
    {
      __typename: 'CloudAppMessageCta',
      id: 'learn_studio_ai',
      text: 'Learn about Studio AI',
      href: 'https://docs.cypress.io/app/guides/cypress-studio',
      style: 'secondary',
      utm: null,
    },
  ],
  dismissal: {
    __typename: 'CloudAppMessageDismissal',
    // Test-fixture choice. Scope routing (user vs project) is unit-tested
    // against the component directly in CloudMessageBanner.cy.tsx; here we
    // pick `'project'` so the dismiss assertion can intercept the simpler
    // project mutation without dragging the global state path through.
    scope: 'project',
  },
  analytics: {
    __typename: 'CloudAppMessageAnalytics',
    campaign: 'ai_tools_education_2026q2',
    category: 'educational',
    utm: null,
  },
}

// Match by query body or operationName suffix — the test schema has no
// resolver for `cloudAppMessages`, so we wholesale-replace the result rather
// than letting an unresolved-field error reach urql.
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
  before(() => {
    cy.task('__internal_optInToCloudAppMessages')
  })

  after(() => {
    cy.task('__internal_restoreCommercialRecommendations')
  })

  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')

    // `startAppServer` defaults `banners._disabled = true` which would
    // suppress the cloud banner. Pre-stub savedState without that flag so
    // banners can surface. Setting it before `startAppServer` short-circuits
    // the default stub.
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

    // Assert via mutation payload — `beforeEach` stubs
    // `getCurrentProjectSavedState`, which would shadow a savedState re-read.
    // The fixture is project-scoped so this intercept matches; see
    // `cloudMessage.dismissal.scope` above.
    cy.intercept('mutation-TrackedBanner_SetProjectState').as('setPrefs')

    cy.visitApp()
    cy.specsPageIsVisible()

    cy.findByTestId('cloud-message-banner').should('be.visible')

    cy.wait('@setPrefs').then((interception) => {
      const body = interception.request.body as { variables: { value: string } }

      expect(body.variables.value).to.contain('lastShown')
    })

    cy.findByTestId('alert-suffix-icon').click()
    cy.findByTestId('cloud-message-banner').should('not.exist')

    cy.wait('@setPrefs').then((interception) => {
      const body = interception.request.body as { variables: { value: string } }
      const value = body.variables.value

      expect(value).to.contain('"banners"')
      expect(value).to.contain('"cloud:ai_tools_education"')
      expect(value).to.contain('"dismissed"')
      expect(value).to.not.contain('shownCount')
    })
  })

  it('falls through to onboarding banners when the channel returns an empty manifest', () => {
    stubCloudAppMessages([])

    cy.visitApp()
    cy.specsPageIsVisible()

    cy.findByTestId('cloud-message-banner').should('not.exist')
    cy.findByTestId('login-banner').should('be.visible')
  })

  it('cloud message wins over onboarding banners when both are eligible', () => {
    stubCloudAppMessages([cloudMessage])

    cy.visitApp()
    cy.specsPageIsVisible()

    cy.findByTestId('cloud-message-banner').should('be.visible').contains(cloudMessage.title)
    cy.findByTestId('login-banner').should('not.exist')
  })
})
