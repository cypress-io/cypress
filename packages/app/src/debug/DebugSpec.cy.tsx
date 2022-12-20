import type { Spec, TestResults } from './DebugSpec.vue'
import DebugSpec from './DebugSpec.vue'
import { defaultMessages } from '@cy/i18n'

const group1 = {
  os: {
    name: 'Linux',
    nameWithVersion: 'Linux Debian',
  },
  browser: {
    formattedName: 'Chrome',
    formattedNameWithVersion: 'Chrome 106',
  },
}

const group2 = {
  os: {
    name: 'Apple',
    nameWithVersion: 'macOS 12.3',
  },
  browser: {
    formattedName: 'Firefox',
    formattedNameWithVersion: 'Firefox 95.2',
  },
}

const testResults: TestResults[] = [
  {
    id: '676df87878',
    titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
    instance: [{
      hasScreenshots: true,
      hasStdout: true,
      hasVideo: true,
      screenshotsUrl: 'www.cypress.io',
      stdoutUrl: 'www.cypress.io',
      videoUrl: 'www.cypress.io',
    }],
  },
  {
    id: '78hjkdf987d9f',
    titleParts: ['Login', 'redirects to stored path after login'],
    instance: [{
      hasScreenshots: true,
      hasStdout: true,
      hasVideo: true,
      screenshotsUrl: 'www.cypress.io',
      stdoutUrl: 'www.cypress.io',
      videoUrl: 'www.cypress.io',
    }],
  },
]

describe('<DebugSpec/> with multiple test results', () => {
  const spec = {
    id: '8879798756s88d',
    path: 'cypress/tests',
    fileName: 'auth',
    fileExtension: '.spec.ts',
    testsPassed: 2,
    testsFailed: 22,
    testsPending: 1,
    specDuration: '2:23',
    groups: [group1],
    testingType: 'component',
  }

  it('mounts correctly', () => {
    cy.mount(() => (
      <DebugSpec spec={spec} testResults={testResults} />
    ))

    cy.findByTestId('debug-spec-item').children().should('have.length', 3)
    cy.findByTestId('spec-contents').children().should('have.length', 2)
    cy.findByTestId('stats-metadata').children().should('have.length', 4)
    cy.findByTestId('spec-path').should('have.text', 'cypress/tests/auth.spec.ts')
    cy.contains('auth').should('be.visible')
    cy.findByTestId('run-failures').should('not.be.disabled')
    .contains(defaultMessages.debugPage.runFailures)

    cy.findByTestId('spec-header-metadata').children().should('have.length', 3)
    cy.findByTestId('debugHeader-results').should('be.visible')

    cy.findAllByTestId('test-group').each((ele) => {
      cy.wrap(ele).within(() => {
        cy.findByTestId('debug-artifacts').should('not.be.visible')
        cy.findByTestId('test-row').realHover().then(() => {
          cy.findByTestId('debug-artifacts').should('be.visible')
        })
      })
    })

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
  it('renders complete UI on smaller viewports', { viewportHeight: 300, viewportWidth: 700 }, () => {
    const spec: Spec = {
      id: '8879798756s88d',
      path: 'cypress/tests',
      fileName: 'AlertBar',
      fileExtension: '.spec.ts',
      testsPassed: 2,
      testsFailed: 22,
      testsPending: 1,
      specDuration: '2:23',
      groups: [group1],
      testingType: 'component',
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

  it('shows complete spec component header with long relative filePath', { viewportHeight: 400, viewportWidth: 600 }, () => {
    const spec: Spec = {
      id: '547a0dG90s7f',
      path: 'src/shared/frontend/cow/packages/foo/cypress/tests/e2e/components',
      fileName: 'AlertBar',
      fileExtension: '.spec.ts',
      testsPassed: 2,
      testsFailed: 22,
      testsPending: 1,
      specDuration: '2:23',
      groups: [group1],
      testingType: 'e2e',
    }

    cy.mount(() => (
      <DebugSpec spec={spec} testResults={testResults} />
    ))

    cy.findByTestId('spec-path').should('have.css', 'text-overflow', 'ellipsis')
    cy.findByTestId('run-failures').should('be.visible')

    cy.percySnapshot()
  })
})

describe('testing groupings', () => {
  it('debug-results-header multiple groups', { viewportWidth: 1032 }, () => {
    const spec = {
      id: '8879798756s88d',
      path: 'cypress/tests',
      fileName: 'auth',
      fileExtension: '.spec.ts',
      testsPassed: '22-23',
      testsFailed: '1-2',
      testsPending: '1-2',
      specDuration: '2:23-3:40',
      groups: [group1, group2],
      testingType: 'e2e',
    }

    cy.mount(() => (
      <DebugSpec spec={spec} testResults={testResults} />
    ))

    cy.findByTestId('debug-spec-item').children().should('have.length', 3)
    cy.findByTestId('spec-contents').children().should('have.length', 2)
    cy.findByTestId('spec-header-metadata').within(() => {
      cy.findByTestId('stats-metadata').children().should('have.length', 5)
    })

    cy.findByTestId('spec-header-metadata').children().should('have.length', 3)

    cy.findAllByTestId('test-group').each((el) => {
      cy.wrap(el).within(() => {
        cy.findAllByTestId('grouped-row').should('have.length', 2)
      })
    })
  })
})
