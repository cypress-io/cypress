import GroupedDebugFailedTest from './GroupedDebugFailedTest.vue'
import type { TestResult } from './DebugSpec.vue'

describe('<GroupedDebugFailedTest/>', () => {
  const testResult: TestResult[] = [
    {
      id: '676df87878',
      titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
      instance: {
        groupId: '123',
        screenshotsUrl: 'www.cypress.io',
        stdoutUrl: 'www.cypress.io',
        videoUrl: 'www.cypress.io',
      },
    },
    {
      id: 'adfkd33829',
      titleParts: ['Groups', 'Testing across multiple groups'],
      instance: {
        groupId: '456',
        screenshotsUrl: 'cloud.cypress.io',
        stdoutUrl: 'cloud.cypress.io',
        videoUrl: 'cloud.cypress.io',
      },
    },
  ]

  const groups = [
    {
      id: '123',
      groupName: 'Staging',
      os: {
        name: 'Linux',
        nameWithVersion: 'Linux Debian',
      },
      browser: {
        formattedName: 'Chrome',
        formattedNameWithVersion: 'Chrome 106',
      },
    },
    {
      id: '456',
      groupName: 'Production',
      os: {
        name: 'Windows',
        nameWithVersion: 'Windows 11.2',
      },
      browser: {
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
