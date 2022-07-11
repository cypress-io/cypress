import { codeFrameColumns } from '@babel/code-frame'
import BaseError from './BaseError.vue'
import { BaseErrorFragmentDoc } from '../../../../launchpad/src/generated/graphql-test'
import dedent from 'dedent'

// Selectors
const headerSelector = 'h1[data-testid=error-header]'
const messageSelector = '[data-testid=error-message]'
const retryButtonSelector = 'button[data-testid=error-retry-button]'
const docsButtonSelector = 'a[data-testid=error-docs-button]'

// Constants
const customHeaderMessage = 'Well, this was unexpected!'
const customMessage = `Don't worry, just click the "It's fixed now" button to try again.`
const customStack = 'some err message\n  at fn (foo.js:1:1)'

describe('<BaseError />', () => {
  afterEach(() => {
    cy.percySnapshot()
  })

  it('renders the default error the correct messages', () => {
    cy.mountFragment(BaseErrorFragmentDoc, {
      render: (gqlVal) => <BaseError gql={gqlVal} showButtons={false} />,
    })
    .get(headerSelector)
    .should('contain.text', cy.gqlStub.ErrorWrapper.title)
    .get(messageSelector)
    .should('contain.text', cy.gqlStub.ErrorWrapper.errorMessage.replace(/\`/g, '').slice(0, 10))
    .get(retryButtonSelector)
    .should('not.exist')
  })

  context('retry action', () => {
    const { docsButton } = cy.i18n.launchpadErrors.generic

    const mountFragmentWithError = (errorProps = {}) => {
      const retrySpy = cy.spy().as('retry')

      cy.mountFragment(BaseErrorFragmentDoc, {
        render: (gqlVal) => (<BaseError gql={{
          ...gqlVal,
          ...errorProps,
        }} onRetry={retrySpy} />),
      })
    }

    it('renders the retry button and docs button', () => {
      mountFragmentWithError()
      cy.contains(retryButtonSelector, cy.i18n.launchpadErrors.generic.retryButton)
      cy.get(docsButtonSelector).should('exist')
    })

    it('renders the expected docs button for unknown errors', () => {
      mountFragmentWithError({ errorStack: 'UNKNOWN ERROR' })
      cy.contains(docsButtonSelector, docsButton.docsHomepage.text)
      .should('have.attr', 'href', docsButton.docsHomepage.link)
    })

    it('renders the expected docs button for dashboard errors', () => {
      mountFragmentWithError({ errorType: 'DASHBOARD_GRAPHQL_ERROR' })
      cy.contains(docsButtonSelector, docsButton.dashboardGuide.text)
      .should('have.attr', 'href', docsButton.dashboardGuide.link)
    })

    it('renders the expected docs button for errors that are known and unrelated to the dashboard', () => {
      mountFragmentWithError({ errorType: 'CONFIG_VALIDATION_ERROR' })
      cy.contains(docsButtonSelector, docsButton.configGuide.text)
      .should('have.attr', 'href', docsButton.configGuide.link)
    })

    it(`emits a 'retry' event when clicked`, () => {
      mountFragmentWithError()
      cy.get(retryButtonSelector)
      .should('not.be.disabled')
      .click()
      .click()
      .get('@retry')
      .should('have.been.calledTwice')
    })

    it('does not render retry or docs buttons when showButtons prop is false', () => {
      cy.mountFragment(BaseErrorFragmentDoc, {
        render: (gqlVal) => <BaseError gql={gqlVal} showButtons={false} />,
      })

      cy.get(retryButtonSelector).should('not.exist')
      cy.get(docsButtonSelector).should('not.exist')
    })
  })

  it('does not open the stack by default if it is not a user error', () => {
    cy.mountFragment(BaseErrorFragmentDoc, {
      onResult (result) {
        result.isUserCodeError = false
      },
      render: (gqlVal) => <BaseError gql={gqlVal} />,
    }).then(() => {
      cy.get('[data-cy=stack-open-true]').should('not.exist')
      cy.contains(cy.i18n.launchpadErrors.generic.stackTraceLabel).click()
      cy.contains('Error: foobar').should('be.visible')
      cy.get('[data-cy=stack-open-true]')
    })
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

  it('renders the header and message slots', () => {
    cy.mountFragment(BaseErrorFragmentDoc, {
      onResult: (result) => {
        result.title = 'Generic title'
        result.errorMessage = 'Generic error'
      },
      render: (gqlVal) => (
        <BaseError
          gql={gqlVal}
          v-slots={{
            header: () => <>{customHeaderMessage}</>,
            message: () => <>{customMessage}</> }}
        />),
    })
    .get('body')
    .should('contain.text', customHeaderMessage)
    .and('contain.text', customMessage)
  })

  it('renders the header and message slots with codeframe', () => {
    cy.mountFragment(BaseErrorFragmentDoc, {
      onResult: (result) => {
        result.title = 'Generic title'
        result.codeFrame = {
          __typename: 'CodeFrame',
          line: 12,
          column: 25,
          codeBlock: codeFrameColumns(dedent`
            const x = 1;
            
            throw new Error('Some Error');

            const y = 2;
          `, {
            start: {
              line: 3,
              column: 5,
            },
          }, {
            linesAbove: 2,
            linesBelow: 4,
          }),
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

  // https://github.com/cypress-io/cypress/issues/22103
  it('wraps the long file path correctly', () => {
    const longFileName = `${'very'.repeat(20)}long/cypress/e2e/file.cy.js`

    cy.mountFragment(BaseErrorFragmentDoc, {
      onResult: (result) => {
        result.codeFrame = {
          __typename: 'CodeFrame',
          line: 12,
          column: 25,
          codeBlock: codeFrameColumns(dedent`
            const x = 1;
            
            throw new Error('Some Error');

            const y = 2;
          `, {
            start: {
              line: 3,
              column: 5,
            },
          }, {
            linesAbove: 2,
            linesBelow: 4,
          }),
          file: {
            id: `FileParts:/absolute/full/path/cypress/e2e/file.cy.js`,
            __typename: 'FileParts',
            relative: longFileName,
            absolute: '/absolute/full/path/cypress/e2e/file.cy.js',
          },
        }
      },
      render: (gqlVal) => (
        <BaseError gql={gqlVal} />),
    })

    cy.findByText(`${longFileName}:12:25`).should('have.css', 'word-break', 'break-all')
  })
})
