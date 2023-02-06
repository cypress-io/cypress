import type { TestResults } from './DebugSpec.vue'
import GroupedDebugFailedTest from './GroupedDebugFailedTest.vue'

describe('<GroupedDebugFailedTest/>', () => {
  const testResult: TestResults[] = [
    {
      id: '676df87878',
      titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
      instance: {
        id: '123',
        groupId: '123',
        status: 'FAILED',
        hasScreenshots: true,
        screenshotsUrl: 'https://cloud.cypress.io/projects/123/runs/456/overview/789/screenshots',
        hasStdout: true,
        stdoutUrl: 'https://cloud.cypress.io/projects/123/runs/456/overview/789/stdout',
        hasVideo: true,
        videoUrl: 'https://cloud.cypress.io/projects/123/runs/456/overview/789/video',
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
        screenshotsUrl: 'https://cloud.cypress.io/projects/123/runs/456/overview/789/screenshots',
        hasStdout: true,
        stdoutUrl: 'https://cloud.cypress.io/projects/123/runs/456/overview/789/stdout',
        hasVideo: true,
        videoUrl: 'https://cloud.cypress.io/projects/123/runs/456/overview/789/video',
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

    cy.get('body').click('topLeft')
    // 👆 this click is to address some flake in CI where this component renders already in the hover state
    // example: https://cloud.cypress.io/projects/ypt4pf/runs/43417/overview/18107774-3213-47f0-902e-79502a832c34/video?reviewViewBy=FAILED&utm_source=Dashboard&utm_medium=Share+URL&utm_campaign=Video
    // this should avoid whatever situation leads to the appearance of being hovered right after mount.

    cy.findAllByTestId(`grouped-row`).should('have.length', 2).each((el) => cy.wrap(el).within(() => {
      cy.findByTestId('debug-artifacts').should('not.be.visible')
      cy.findByTestId('test-failed-metadata').realHover()
      cy.findByTestId('debug-artifacts').should('be.visible').children().should('have.length', 3)
      cy.findByTestId('stats-metadata').children().should('have.length', 3)
    }))

    cy.percySnapshot()
  })
})
