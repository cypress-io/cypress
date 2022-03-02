import BaseError from './BaseError.vue'
import Button from '@cy/components/Button.vue'
import { BaseErrorFragmentDoc } from '../generated/graphql-test'
import dedent from 'dedent'

// Selectors
const headerSelector = '[data-testid=error-header]'
const messageSelector = '[data-testid=error-message]'
const retryButtonSelector = '[data-testid=error-retry-button]'
const customFooterSelector = '[data-testid=custom-error-footer]'

// Constants
const messages = cy.i18n.launchpadErrors.generic
const customHeaderMessage = 'Well, this was unexpected!'
const customMessage = `Don't worry, just click the "It's fixed now" button to try again.`
const customFooterText = `Yikes, try again!`
const customStack = 'some err message\n  at fn (foo.js:1:1)'

describe('<BaseError />', () => {
  afterEach(() => {
    cy.percySnapshot()
  })

  it('renders the default error the correct messages', () => {
    cy.mountFragment(BaseErrorFragmentDoc, {
      render: (gqlVal) => <BaseError gql={gqlVal} />,
    })
    .get(headerSelector)
    .should('contain.text', cy.gqlStub.ErrorWrapper.title)
    .get(messageSelector)
    .should('contain.text', cy.gqlStub.ErrorWrapper.errorMessage.replace(/\`/g, '').slice(0, 10))
    .get(retryButtonSelector)
    .should('not.exist')
  })

  it('renders the retry button if retry is passed', () => {
    cy.mountFragment(BaseErrorFragmentDoc, {
      render: (gqlVal) => <BaseError gql={gqlVal} retry={() => {}} />,
    })
    .get(retryButtonSelector)
    .should('contain.text', messages.retryButton)
  })

  it('does not open the stack by default if it is not a user error', () => {
    cy.mountFragment(BaseErrorFragmentDoc, {
      onResult (result) {
        result.isUserCodeError = false
      },
      render: (gqlVal) => <BaseError gql={gqlVal} />,
    }).then(() => {
      cy.get('[data-cy=stack-open-true]').should('not.exist')
      cy.contains('Stack Trace').click()
      cy.contains('Error: foobar').should('be.visible')
      cy.get('[data-cy=stack-open-true]')
    })
  })

  it('calls the retry function passed in', () => {
    const retrySpy = cy.spy().as('retry')

    cy.mountFragment(BaseErrorFragmentDoc, {
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
    cy.mountFragment(BaseErrorFragmentDoc, {
      onResult: (result) => {
        result.title = customHeaderMessage
        result.errorMessage = customMessage
        result.errorStack = customStack
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
    cy.mountFragment(BaseErrorFragmentDoc, {
      onResult: (result) => {
        result.title = messages.header
        result.errorMessage = messages.message
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

  it('renders the header, message, and footer slots', () => {
    cy.mountFragment(BaseErrorFragmentDoc, {
      onResult: (result) => {
        result.title = messages.header
        result.codeFrame = {
          __typename: 'CodeFrame',
          line: 12,
          column: 25,
          codeBlockStartLine: 10,
          codeBlock: dedent`
            const x = 1;
            
            throw new Error("Some Error")

            const y = 1;
          `,
          file: {
            id: `FileParts:/absolute/full/path/cypress/e2e/file.cy.js`,
            __typename: 'FileParts',
            relative: 'cypress/e2e/file.cy.js',
            absolute: '/absolute/full/path/cypress/e2e/file.cy.js',
          },
        }
      },
      render: (gqlVal) => (
        <BaseError gql={gqlVal} />),
    })

    cy.findByText('cypress/e2e/file.cy.js:12:25').should('be.visible')
  })
})
