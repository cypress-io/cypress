import { defaultMessages } from '@cy/i18n'
import BaseError from './BaseError.vue'
import Button from '@cy/components/Button.vue'
import { BaseError_DataFragmentDoc } from '../generated/graphql-test'

// Selectors
const headerSelector = '[data-testid=error-header]'
const messageSelector = '[data-testid=error-message]'
const retryButtonSelector = '[data-testid=error-retry-button]'
const docsButtonSelector = '[data-testid=error-read-the-docs-button]'
const customFooterSelector = '[data-testid=custom-error-footer]'

// Constants
const messages = defaultMessages.launchpadErrors.generic
const customHeaderMessage = 'Well, this was unexpected!'
const customMessage = `Don't worry, just click the "It's fixed now" button to try again.`
const customFooterText = `Yikes, try again!`
const customStack = 'some err message\n  at fn (foo.js:1:1)'

describe('<BaseError />', () => {
  afterEach(() => {
    cy.percySnapshot()
  })

  it('renders the default error the correct messages', () => {
    cy.mountFragment(BaseError_DataFragmentDoc, {
      onResult: (result) => {
        result.title = messages.header
      },
      render: (gqlVal) => <BaseError gql={gqlVal} retry={() => {}} />,
    })
    .get(headerSelector)
    .should('contain.text', messages.header)
    .get(messageSelector)
    .should('contain.text', `It looks like there's some issues that need to be resolved before we continue`)
    .get(retryButtonSelector)
    .should('contain.text', messages.retryButton)
    .get(docsButtonSelector)
    .should('contain.text', messages.readTheDocsButton)
  })

  it('calls the retry function passed in', () => {
    const retrySpy = cy.spy().as('retry')

    cy.mountFragment(BaseError_DataFragmentDoc, {
      onResult: (result) => {
        result.title = messages.header
        result.message = null
      },
      render: (gqlVal) => (<div class="p-16px">
        <BaseError gql={gqlVal} retry={retrySpy} />,
      </div>),
    })
    .get(retryButtonSelector)
    .click()
    .click()
    .get('@retry')
    .should('have.been.calledTwice')
  })

  it('renders custom error messages and headers with props', () => {
    cy.mountFragment(BaseError_DataFragmentDoc, {
      onResult: (result) => {
        result.title = customHeaderMessage
        result.message = customMessage
        result.stack = customStack
      },
      render: (gqlVal) => (<div class="p-16px">
        <BaseError gql={gqlVal} />
      </div>),
    })
    .get('body')
    .should('contain.text', customHeaderMessage)
    .and('contain.text', customMessage)
    .and('contain.text', customStack)
  })

  it('renders the header, message, and footer slots', () => {
    cy.mountFragment(BaseError_DataFragmentDoc, {
      onResult: (result) => {
        result.title = messages.header
        result.message = messages.message
      },
      render: (gqlVal) => (
        <BaseError
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
