import Wizard from './Wizard.vue'
import { WizardFragmentDoc } from '../generated/graphql-test'

describe('Wizard', () => {
  it('works', () => {
    cy.mountFragment(WizardFragmentDoc, {
      render: (gqlVal) => {
        return <Wizard gql={gqlVal} />
      },
    })
  })

  it('does not render browser error if there is not one', () => {
    cy.mountFragment(WizardFragmentDoc, {
      onResult: (result) => {
        result.wizard.step = 'setupComplete'
      },
      render: (gqlVal) => <div class="p-4"><Wizard gql={gqlVal} /></div>,
    })

    cy.contains('There was an error').should('not.exist')
  })

  it('does not render browser error if not on browser step', () => {
    cy.mountFragment(WizardFragmentDoc, {
      onResult: (result) => {
        result.browserWarning = {
          title: 'Browser Warning',
          message: 'There was an error',
        }
      },
      render: (gqlVal) => <div class="p-4"><Wizard gql={gqlVal} /></div>,
    })

    cy.contains('There was an error').should('not.exist')
  })

  it('renders browser error if there is one and on browser step', () => {
    cy.mountFragment(WizardFragmentDoc, {
      onResult: (result) => {
        result.wizard.step = 'setupComplete'
        result.browserWarning = {
          title: 'Browser Warning',
          message: 'There was an error',
        }
      },
      render: (gqlVal) => <div class="p-4"><Wizard gql={gqlVal} /></div>,
    })

    cy.contains('There was an error').should('be.visible')
  })
})
