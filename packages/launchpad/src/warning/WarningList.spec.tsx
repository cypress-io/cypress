import { WarningListFragmentDoc } from '../generated/graphql-test'
import WarningList from './WarningList.vue'

const createWarning = (props = {}) => Object.assign({
  __typename: 'Warning',
  title: 'Warning title',
  message: 'Warning message',
  setupStep: 'welcome',
}, props)

describe('<WarningList />', () => {
  it('does not render warning if there are none', () => {
    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.step = 'setupComplete'
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.get('[data-cy=warning]').should('not.exist')
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

    cy.contains('Warning message').should('not.exist')
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

    cy.contains('Warning message').should('be.visible')
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

    cy.contains('Warning message').should('be.visible')
  })

  it('renders multiple warnings', () => {
    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.step = 'setupComplete'
        // @ts-ignore
        result.warnings = [createWarning({
          title: 'Warning title 1',
          message: 'Warning message 1',
          setupStep: null,
        // @ts-ignore
        }), createWarning({
          title: 'Warning title 2',
          message: 'Warning message 2',
          setupStep: null,
        })]
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.get('[data-cy=warning]').should('have.length', 2)
  })

  it('removes warning when dismissed', () => {
    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.step = 'setupComplete'
        // @ts-ignore
        result.warnings = [createWarning({
          title: 'Warning title 1',
          message: 'Warning message 1',
          setupStep: null,
        // @ts-ignore
        }), createWarning({
          title: 'Warning title 2',
          message: 'Warning message 2',
          setupStep: null,
        })]
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.get('[data-cy=warning]').should('have.length', 2)
    cy.contains('Warning message 1')
    cy.get('[data-cy=dismiss]').first().click()
    cy.get('[data-cy=warning]').should('have.length', 1)
    cy.contains('Warning message 1').should('not.exist')
  })
})
