import GroupedDebugFailedTest from './GroupedDebugFailedTest.vue'
import type { TestResults } from './DebugSpec.vue'

describe('<GroupedDebugFailedTest/>', () => {
  const testResult: TestResults[] = [
    {
      id: '676df87878',
      titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
      instance: {
        id: '123',
        status: 'FAILED',
        groupId: '123',
        hasScreenshots: true,
        screenshotsUrl: 'www.cypress.io',
        hasStdout: true,
        stdoutUrl: 'www.cypress.io',
        hasVideo: true,
        videoUrl: 'www.cypress.io',
      },
    },
    {
      id: 'adfkd33829',
      titleParts: ['Groups', 'Testing across multiple groups'],
      instance: {
        id: '456',
        status: 'FAILED',
        groupId: '456',
        hasScreenshots: true,
        screenshotsUrl: 'cloud.cypress.io',
        hasStdout: true,
        stdoutUrl: 'cloud.cypress.io',
        hasVideo: true,
        videoUrl: 'cloud.cypress.io',
      },
    },
  ]

  const groups = [
    {
      id: '123',
      groupName: 'Staging',
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
    },
    {
      id: '456',
      groupName: 'Production',
      os: {
        id: '456',
        name: 'Windows',
        nameWithVersion: 'Windows 11.2',
      },
      browser: {
        id: '456',
        formattedName: 'Electron',
        formattedNameWithVersion: 'Electron 106',
      },
    },
  ]

  it('mounts correctly and shows artifacts on hover', () => {
    cy.mount(() => (
      <div class='p-24px'>
        <GroupedDebugFailedTest groups={groups} failedTests={testResult} />
      </div>
    ))

    cy.findAllByTestId(`grouped-row`).should('have.length', 2)
    .each((el) => {
      cy.wrap(el).findByTestId('debug-artifacts').should('not.be.visible')
      cy.wrap(el).realHover().then(() => {
        cy.wrap(el).findByTestId('debug-artifacts').should('be.visible').children().should('have.length', 3)
      })

      cy.wrap(el).findByTestId('stats-metadata').children().should('have.length', 3)
    })

    cy.percySnapshot()
  })
})
