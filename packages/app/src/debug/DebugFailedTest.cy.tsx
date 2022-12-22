import DebugFailedTest from './DebugFailedTest.vue'
import type { TestResult } from './DebugSpec.vue'

const group1 = {
  os: {
    name: 'Linux',
    nameWithVersion: 'Linux Debian',
  },
  browser: {
    formattedName: 'Chrome',
    formattedNameWithVersion: 'Chrome 106',
  },
  groupName: 'Staging',
  id: '123',
}

const group2 = {
  os: {
    name: 'Windows',
    nameWithVersion: 'Windows 110',
  },
  browser: {
    formattedName: 'Electron',
    formattedNameWithVersion: 'Electron 106',
  },
  groupName: 'Production',
  id: '456',
}

describe('<DebugFailedTest/>', () => {
  it('mounts correctly', () => {
    const testResult: TestResult = {
      id: '676df87878',
      titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
      instance: {
        groupId: '123',
      },
    }

    cy.mount(() => (
      <DebugFailedTest failedTestResult={[testResult]} groups={[group1]} />
    ))

    cy.findByTestId('test-row').children().should('have.length', 4)
    cy.findByTestId('failed-icon').should('be.visible')
    testResult.titleParts.forEach((title, index) => {
      cy.findByTestId(`titleParts-${index}`).should('have.text', `${title}`)
    })
  })

  it('contains multiple titleParts segments', () => {
    const multipleTitleParts = {
      id: '676df87878',
      titleParts: ['Login', 'Describe', 'it', 'context', 'Should redirect unauthenticated user to signin page'],
      instance: {
        groupId: '456',
      },
    }

    cy.mount(() => (
      <DebugFailedTest failedTestResult={[multipleTitleParts]} groups={[group1]} />
    ))

    cy.findByTestId('test-row').children().should('have.length', 7).should('be.visible')
    multipleTitleParts.titleParts.forEach((title, index) => {
      cy.findByTestId(`titleParts-${index}`).should('have.text', `${title}`)
    })

    cy.percySnapshot()
  })

  it('tests multiple groups', () => {
    const testResults: TestResult[] = [
      {
        id: '676df87878',
        titleParts: ['Login', 'Describe', 'it', 'context', 'Should redirect unauthenticated user to signin page'],
        instance: {
          groupId: '456',
        },
      },
      {
        id: '676df87878',
        titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
        instance: {
          groupId: '123',
        },
      },
    ]

    cy.mount(() => (
      <DebugFailedTest failedTestResult={testResults} groups={[group1, group2]} />
    ))

    cy.findAllByTestId('grouped-row').should('have.length', 2)
  })
})
