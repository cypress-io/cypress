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
        hasReplay: true,
        replayUrl: 'https://cloud.cypress.io/projects/123/runs/456/overview/789/replay',
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
        hasReplay: true,
        replayUrl: 'https://cloud.cypress.io/projects/123/runs/456/overview/789/replay',
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
    // On retries in CI, the realHover() event can be persistent, causing the component to
    // be hovered at the start of the test. We therefore hover the mouse somewhere else on the screen
    // to reduce flake.
    // This sort of weirdness is exactly why Cypress doesn't support a 'hover' command natively.
    cy.get('body').realHover({ position: 'topLeft' })

    cy.mount(() => (
      <div class='p-[24px]'>
        <GroupedDebugFailedTest groups={groups} failedTests={testResult} />
      </div>
    ))

    cy.findAllByTestId(`grouped-row`).should('have.length', 2).each((el) => cy.wrap(el).within(() => {
      cy.findByTestId('debug-artifacts').should('not.be.visible')
      cy.findByTestId('test-failed-metadata').realHover()
      cy.findByTestId('debug-artifacts').should('be.visible').children().should('have.length', 4)
      cy.findByTestId('stats-metadata').children().should('have.length', 3)
    }))
  })
})
