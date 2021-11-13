import { defaultMessages } from '@cy/i18n'
import ErrorDisplay from './ErrorDisplay.vue'
import Button from '@cy/components/Button.vue'
import { ErrorDisplayFragmentDoc } from '../generated/graphql-test'

// Selectors
const headerSelector = '[data-testid=error-header]'
const messageSelector = '[data-testid=error-message]'
const retryButtonSelector = '[data-testid=error-retry-button]'
const docsButtonSelector = '[data-testid=error-read-the-docs-button]'
const docsLinkSelector = '[data-testid=error-docs-link]'
const customFooterSelector = '[data-testid=custom-error-footer]'

// Constants
const docsLink = 'https://docs.cypress.io'
const messages = defaultMessages.launchpadErrors.generic
const customHeaderMessage = 'Well, this was unexpected!'
const customMessage = `Don't worry, just click the "It's fixed now" button to try again.`
const customFooterText = `Yikes, try again!`
const customStack = 'some err message\n  at fn (foo.js:1:1)'

describe('<ErrorDisplay />', () => {
  afterEach(() => {
    cy.percySnapshot()
  })

  it('renders the default error the correct messages', () => {
    cy.mountFragment(ErrorDisplayFragmentDoc, {
      onResult: (result) => {
        result.title = messages.header
      },
      render: (gqlVal) => <ErrorDisplay gql={gqlVal} />,
    })
    .get(headerSelector)
    .should('contain.text', messages.header)
    .get(messageSelector)
    .should('contain.text', messages.message.replace('{0}', 'cypress.config.js'))
    .get(retryButtonSelector)
    .should('contain.text', messages.retryButton)
    .get(docsButtonSelector)
    .should('contain.text', messages.readTheDocsButton)
    .get(docsLinkSelector)
    .should('have.attr', 'href', docsLink)
  })

  // NOTE: Figure out how to stub the graphql mutation call
  it.skip('emits the retry event by default', () => {
    cy.mountFragment(ErrorDisplayFragmentDoc, {
      onResult: (result) => {
        result.title = messages.header
        result.message = null
      },
      render: (gqlVal) => <ErrorDisplay gql={gqlVal} />,
    })
    .get(retryButtonSelector)
    .click()
    .click()
    .get('@retry')
    .should('have.been.calledTwice')
  })

  it('renders custom error messages and headers with props', () => {
    cy.mountFragment(ErrorDisplayFragmentDoc, {
      onResult: (result) => {
        result.title = customHeaderMessage
        result.message = customMessage
        result.stack = customStack
      },
      render: (gqlVal) => <ErrorDisplay gql={gqlVal} />,
    })
    .get('body')
    .should('contain.text', customHeaderMessage)
    .and('contain.text', customMessage)
    .and('contain.text', customStack)
  })

  it('renders the header, message, and footer slots', () => {
    cy.mountFragment(ErrorDisplayFragmentDoc, {
      onResult: (result) => {
        result.title = messages.header
        result.message = messages.message
      },
      render: (gqlVal) => (
        <ErrorDisplay
          gql={gqlVal}
          v-slots={{
            footer: () => <Button size="lg" data-testid="custom-error-footer">{ customFooterText }</Button>,
            header: () => <>{customHeaderMessage}</>,
            message: () => <>{customMessage}</> }}
        />),
    })
    .get('body')
    .should('contain.text', customHeaderMessage)
    .and('contain.text', customMessage)
    .get(customFooterSelector)
    .should('contain.text', customFooterText)
  })
})
