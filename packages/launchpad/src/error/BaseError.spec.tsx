import { defaultMessages } from '@cy/i18n'
import BaseError from './BaseError.vue'
import Button from '@cy/components/Button.vue'
import { BaseErrorFragmentDoc } from '../generated/graphql-test'

// Selectors
const headerSelector = '[data-cy=error-header]'
const messageSelector = '[data-cy=error-message]'
const retryButtonSelector = '[data-cy=error-retry-button]'
const docsButtonSelector = '[data-cy=error-read-the-docs-button]'
const customFooterSelector = '[data-cy=custom-error-footer]'
const openConfigFileSelector = '[data-cy=open-config-file]'

// Constants
const messages = defaultMessages.launchpadErrors.generic
const customHeaderMessage = 'Well, this was unexpected!'
const customMessage = `Don't worry, just click the "It's fixed now" button to try again.`
const customFooterText = `Yikes, try again!`
const customStack = 'some err message\n  at fn (foo.js:1:1)'

describe('<BaseError />', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('latestGQLOperation', '{}')
    })
  })

  afterEach(() => {
    cy.percySnapshot()
  })

  it('renders the default error the correct messages', () => {
    cy.mountFragment(BaseErrorFragmentDoc, {
      onResult: (result) => {
        if (result.baseError) {
          result.baseError.title = messages.header
        }

        if (result.currentProject) {
          result.currentProject.configFilePath = 'cypress.config.ts'
        }
      },
      render: (gqlVal) => <BaseError gql={gqlVal} />,
    })
    .get(headerSelector)
    .should('contain.text', messages.header)
    .get(messageSelector)
    .should('contain.text', messages.message.replace('{0}', 'cypress.config.ts'))
    .get(retryButtonSelector)
    .should('contain.text', messages.retryButton)
    .get(docsButtonSelector)
    .should('contain.text', messages.readTheDocsButton)
    .get(openConfigFileSelector)
    .click()

    cy.get('#headlessui-dialog-title-3').contains('Select Preferred Editor')
  })

  // NOTE: Figure out how to stub the graphql mutation call
  it.skip('emits the retry event by default', () => {
    cy.mountFragment(BaseErrorFragmentDoc, {
      onResult: (result) => {
        if (result.baseError) {
          result.baseError.title = messages.header
          result.baseError.message = null
        }
      },
      render: (gqlVal) => <BaseError gql={gqlVal} />,
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
        if (result.baseError) {
          result.baseError.title = customHeaderMessage
          result.baseError.message = customMessage
          result.baseError.stack = customStack
        }
      },
      render: (gqlVal) => <BaseError gql={gqlVal} />,
    })
    .get('body')
    .should('contain.text', customHeaderMessage)
    .and('contain.text', customMessage)
    .and('contain.text', customStack)
  })

  it('renders the header, message, and footer slots', () => {
    cy.mountFragment(BaseErrorFragmentDoc, {
      onResult: (result) => {
        if (result.baseError) {
          result.baseError.title = messages.header
          result.baseError.message = messages.message
        }
      },
      render: (gqlVal) => (
        <BaseError
          gql={gqlVal}
          v-slots={{
            footer: () => <Button size="lg" data-cy="custom-error-footer">{ customFooterText }</Button>,
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
