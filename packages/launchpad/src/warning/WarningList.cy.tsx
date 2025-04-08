import { WarningListFragmentDoc } from '../generated/graphql-test'
import WarningList from './WarningList.vue'
import { faker } from '@faker-js/faker'
// tslint:disable-next-line: no-implicit-dependencies - need to handle this
import { defaultMessages } from '@cy/i18n'
import { WarningList_RemoveWarningDocument } from '../generated/graphql'

faker.seed(1)

const warningSelector = '[data-cy=warning-alert]'

const createWarning = (props = {}) => ({
  ...cy.gqlStub.ErrorWrapper,
  ...props,
})

const firstWarning = createWarning({ title: faker.hacker.ingverb(), errorMessage: faker.hacker.phrase(), id: 'Warning1' })
const secondWarning = createWarning({ title: faker.hacker.ingverb(), errorMessage: faker.hacker.phrase(), id: 'Warning2' })

describe('<WarningList />', () => {
  it('does not render warning if there are none', () => {
    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.warnings = []
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.get(warningSelector).should('not.exist')
  })

  it('renders multiple warnings', () => {
    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.warnings = [
          firstWarning,
          secondWarning,
        ]
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.get(warningSelector).should('have.length', 2)
  })

  it('removes warning when dismissed', () => {
    cy.stubMutationResolver(WarningList_RemoveWarningDocument, (defineResult, { id }) => {
      return defineResult({
        dismissWarning: {
          __typename: 'Query',
          warnings: [secondWarning],
        },
      })
    })

    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.warnings = [firstWarning, secondWarning]
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.get(warningSelector).should('have.length', 2)
    cy.contains(firstWarning.errorMessage)

    cy.findAllByLabelText(defaultMessages.components.modal.dismiss).first().click()
    cy.get(warningSelector).should('have.length', 1)
    cy.contains(firstWarning.errorMessage).should('not.exist')
  })
})
