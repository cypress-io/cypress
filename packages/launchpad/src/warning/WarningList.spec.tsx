import { WarningListFragmentDoc } from '../generated/graphql-test'
import WarningList from './WarningList.vue'
import faker from 'faker'
import { defaultMessages } from '@cy/i18n'

const warningSelector = '[data-testid=warning-alert]'
const message = faker.hacker.phrase()
const title = faker.hacker.ingverb()

const createWarning = (props = {}) => ({
  __typename: 'Warning',
  title,
  message,
  setupStep: 'welcome',
  ...props,
})

const firstWarning = createWarning({ title: faker.hacker.ingverb(), message: faker.hacker.phrase(), setupStep: null })
const secondWarning = createWarning({ title: faker.hacker.ingverb(), message: faker.hacker.phrase(), setupStep: null })

describe('<WarningList />', () => {
  it('does not render warning if there are none', () => {
    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.step = 'setupComplete'
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.get(warningSelector).should('not.exist')
  })

  it('does not render warning if on different step', () => {
    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.step = 'setupComplete'
        // @ts-ignore
        result.warnings = [createWarning()]
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.contains(message).should('not.exist')
  })

  it('renders warning if on same step', () => {
    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.step = 'setupComplete'
        // @ts-ignore
        result.warnings = [createWarning({
          setupStep: 'setupComplete',
        })]
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.contains(message).should('be.visible')
  })

  it('renders warning if no step specified', () => {
    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.step = 'setupComplete'
        // @ts-ignore
        result.warnings = [createWarning({
          setupStep: null,
        })]
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.contains(message).should('be.visible')
  })

  it('renders multiple warnings', () => {
    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.step = 'setupComplete'
        // @ts-ignore
        result.warnings = [firstWarning, secondWarning]
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.get(warningSelector).should('have.length', 2)
  })

  it('removes warning when dismissed', () => {
    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.step = 'setupComplete'
        // @ts-ignore
        result.warnings = [firstWarning, secondWarning]
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.get(warningSelector).should('have.length', 2)
    cy.contains(firstWarning.message)

    // @ts-ignore
    cy.findAllByLabelText(defaultMessages.components.modal.dismiss).first().click()
    cy.get(warningSelector).should('have.length', 1)
    cy.contains(firstWarning.message).should('not.exist')
  })
})
