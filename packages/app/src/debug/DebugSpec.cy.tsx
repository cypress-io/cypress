import type { Spec, TestResults } from './DebugSpec.vue'
import DebugSpec from './DebugSpec.vue'

describe('<DebugSpec/>', () => {
  it('renders correctly with multiple test results in Spec', () => {
    const spec: Spec = {
      id: '8879798756s88d',
      path: 'cypress/tests/auth.spec.ts',
    }

    const testResults: TestResults[] = [
      {
        id: '676df87878',
        titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
      },
      {
        id: '78hjkdf987d9f',
        titleParts: ['Login', 'redirects to stored path after login'],
      },
    ]

    cy.mount(() => (
      <DebugSpec spec={spec} testResults={testResults} />
    ))

    cy.findByTestId('debug-spec-item').children().should('have.length', 3)
    cy.findByTestId('spec-contents').children().should('have.length', 2)
    cy.findByTestId('spec-path').should('have.text', 'cypress/tests/auth.spec.ts')
    cy.contains('auth').should('have.css', 'color', 'rgb(46, 50, 71)')
    cy.findByTestId('run-failures').should('not.be.disabled')
    .should('have.text', ' Run Failures ')
    .should('have.css', 'color', 'rgb(73, 86, 227)')

    cy.findAllByTestId('test-group').should('have.length', 2)
  })

  it('renders correctly with single test and a disabled run-failures button', () => {
    const spec: Spec = {
      id: '5479adf90s7f',
      path: 'cypress/tests/top-nav-launchpad.spec.ts',
    }

    const testResults: TestResults[] = [
      {
        id: 'hf89dkb300js',
        titleParts: ['Launchpad Top Nav Workflows', 'user not logged in'],
      },
    ]

    cy.mount(() => (
      <DebugSpec spec={spec} testResults={testResults} disabled={true} />
    ))

    cy.findByTestId('debug-spec-item').children().should('have.length', 2)
    cy.findByTestId('spec-path').should('have.text', 'cypress/tests/top-nav-launchpad.spec.ts')
    cy.contains('top-nav-launchpad').should('have.css', 'color', 'rgb(46, 50, 71)')
    cy.findByTestId('run-failures-disabled').should('be.disabled')
    .should('have.css', 'color', 'rgb(144, 149, 173)')
  })
})
