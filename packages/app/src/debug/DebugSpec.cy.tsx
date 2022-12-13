import type { Spec, TestResults } from './DebugSpec.vue'
import DebugSpec from './DebugSpec.vue'
import { defaultMessages } from '@cy/i18n'

describe('<DebugSpec/> with multiple test results', () => {
  const spec: Spec = {
    id: '8879798756s88d',
    path: 'cypress/tests/',
    fileName: 'auth',
    fileExtension: '.spec.ts',
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

  it('mounts correctly', () => {
    cy.mount(() => (
      <DebugSpec spec={spec} testResults={testResults} />
    ))

    cy.findByTestId('debug-spec-item').children().should('have.length', 3)
    cy.findByTestId('spec-contents').children().should('have.length', 2)
    cy.findByTestId('spec-path').should('have.text', 'cypress/tests/auth.spec.ts')
    cy.contains('auth').should('be.visible')
    cy.findByTestId('run-failures').should('not.be.disabled')
    .contains(defaultMessages.debugPage.runFailures)

    cy.findAllByTestId('test-group').should('have.length', 2)

    cy.percySnapshot()
  })

  it('renders correctly with disabled run-failures button', () => {
    cy.mount(() => (
      <DebugSpec spec={spec} testResults={testResults} isDisabled={true} />
    ))

    cy.findByTestId('run-failures').should('have.attr', 'aria-disabled', 'disabled')
    .should('not.have.attr', 'href')

    cy.percySnapshot()
  })
})

describe('<DebugSpec/> responsive UI', () => {
  const testResults: TestResults[] = [
    {
      id: 'ab78dkb300js',
      titleParts: ['Alert Bar with state', 'Alert Bar shows passing message'],
    },
    {
      id: 'ab78dkb590js',
      titleParts: ['Alert Bar with state', 'Alert Bar shows failure message'],
    },
  ]

  it('renders complete UI on smaller viewports', { viewportHeight: 300, viewportWidth: 450 }, () => {
    const spec: Spec = {
      id: '5479adf90s7f',
      path: 'cypress/tests/',
      fileName: 'AlertBar',
      fileExtension: '.spec.ts',
    }

    cy.mount(() => (
      <DebugSpec spec={spec} testResults={testResults} />
    ))

    cy.findByTestId('spec-contents').children().should('have.length', 2)
    cy.findByTestId('spec-path').should('have.text', 'cypress/tests/AlertBar.spec.ts')
    cy.contains('AlertBar').should('be.visible')
    cy.findByTestId('run-failures').should('be.visible')

    cy.percySnapshot()
  })

  it('shows complete spec component header with long relative filePath', () => {
    const spec: Spec = {
      id: '547a0dG90s7f',
      path: 'src/shared/frontend/cow/packages/foo/cypress/tests/e2e/components',
      fileName: 'AlertBar',
      fileExtension: '.spec.ts',
    }

    cy.mount(() => (
      <DebugSpec spec={spec} testResults={testResults} />
    ))

    cy.findByTestId('spec-path').should('have.css', 'text-overflow', 'ellipsis')
    cy.findByTestId('run-failures').should('be.visible')

    cy.percySnapshot()
  })
})
