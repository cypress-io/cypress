import DebugFailedTest from './DebugFailedTest.vue'
import type { TestResults } from './DebugSpec.vue'

const group1 = {
  os: {
    id: '123',
    name: 'Linux',
    nameWithVersion: 'Linux Debian',
  },
  browser: {
    id: '123',
    formattedName: 'Chrome',
    formattedNameWithVersion: 'Chrome 106',
  },
  groupName: 'Staging',
  id: '123',
}

const group2 = {
  os: {
    id: '123',
    name: 'Windows',
    nameWithVersion: 'Windows 110',
  },
  browser: {
    id: '123',
    formattedName: 'Electron',
    formattedNameWithVersion: 'Electron 106',
  },
  groupName: 'Production',
  id: '456',
}

describe('<DebugFailedTest/>', () => {
  it('mounts correctly', () => {
    const testResult: TestResults = {
      id: '676df87878',
      titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
      instance: {
        id: '123',
        groupId: '123',
        status: 'FAILED',
        hasScreenshots: false,
        hasStdout: false,
        hasVideo: false,
      },
    }

    cy.mount(() => (
      <div data-cy="test-group">
        <DebugFailedTest failedTestsResult={[testResult]} groups={[group1]} expandable={false}/>
      </div>
    ))

    cy.findByTestId('test-row').children().should('have.length', 4)
    cy.findByTestId('failed-icon').should('be.visible')
    testResult.titleParts.forEach((title, index) => {
      cy.findByTestId(`titleParts-${index}`).should('have.text', `${title}`)
    })

    cy.findByTestId('test-group').realHover()
    cy.findByTestId('debug-artifacts').should('be.visible').children().should('have.length', 3)

    cy.percySnapshot()
  })

  it('contains multiple titleParts segments', () => {
    const multipleTitleParts: TestResults = {
      id: '676df87878',
      titleParts: ['Login', 'Describe', 'it', 'context', 'Should redirect unauthenticated user to signin page'],
      instance: {
        id: '456',
        groupId: '456',
        status: 'FAILED',
        hasScreenshots: false,
        hasStdout: false,
        hasVideo: false,
      },
    }

    cy.mount(() => (
      <DebugFailedTest failedTestsResult={[multipleTitleParts]} groups={[group1]} expandable={false}/>
    ))

    cy.findByTestId('test-row').children().should('have.length', 7).should('be.visible')
    multipleTitleParts.titleParts.forEach((title, index) => {
      cy.findByTestId(`titleParts-${index}`).should('have.text', `${title}`)
    })

    cy.percySnapshot()
  })

  it('tests multiple groups', () => {
    const testResults: TestResults[] = [
      {
        id: '676df87878',
        titleParts: ['Login', 'Describe', 'it', 'context', 'Should redirect unauthenticated user to signin page'],
        instance: {
          id: '456',
          groupId: '456',
          status: 'FAILED',
          hasScreenshots: false,
          hasStdout: false,
          hasVideo: false,
        },
      },
      {
        id: '676df87878',
        titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
        instance: {
          id: '123',
          groupId: '123',
          status: 'FAILED',
          hasScreenshots: false,
          hasStdout: false,
          hasVideo: false,
        },
      },
    ]

    cy.mount(() => (
      <DebugFailedTest failedTestsResult={testResults} groups={[group1, group2]} expandable={true}/>
    ))

    cy.findAllByTestId('grouped-row').should('have.length', 2)
    cy.findAllByTestId('grouped-row').first().realHover()
    cy.findAllByTestId('debug-artifacts').first().should('be.visible').children().should('have.length', 3)
    cy.percySnapshot()
  })
})
