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

const instance1: TestResults['instance'] = {
  id: '123',
  groupId: '123',
  status: 'FAILED',
  hasScreenshots: true,
  hasReplay: true,
  replayUrl: 'https://cloud.cypress.io/projects/123/runs/456/overview/789/replay',
  screenshotsUrl: 'https://cloud.cypress.io/projects/123/runs/456/overview/789/screenshots',
  hasStdout: true,
  stdoutUrl: 'https://cloud.cypress.io/projects/123/runs/456/overview/789/stdout',
  hasVideo: true,
  videoUrl: 'https://cloud.cypress.io/projects/123/runs/456/overview/789/video',
}

const instance2: TestResults['instance'] = {
  ...instance1,
  id: '456',
  groupId: '456',
}

/**
 * This helper testing function mimics mappedTitleParts in DebugFailedTest.
 * It creates an ordered array of titleParts and chevron icons and then asserts
 * the order in which they are rendered using the testAttr and text values.
 */
const assertRowContents = (testResults: TestResults) => {
  const l = testResults.titleParts.length
  const finalPartLength = testResults.titleParts[l - 1].length
  const assertionArr = [{ testAttr: 'failed-icon', text: '' }]

  if (l <= 3) {
    testResults.titleParts.forEach((title, index) => {
      if (index === l - 1) {
        assertionArr.push({ testAttr: `titleParts-${index}-title`, text: testResults.titleParts[l - 1].slice(0, finalPartLength - 15) })
        assertionArr.push({ testAttr: `titleParts-${index + 1}-title`, text: testResults.titleParts[l - 1].slice(finalPartLength - 15) })
      } else {
        assertionArr.push({ testAttr: `titleParts-${index}-title`, text: title })
        assertionArr.push({ testAttr: `titleParts-${index + 1}-chevron`, text: '' })
      }
    })
  } else {
    testResults.titleParts.forEach((title, index) => {
      if (index === l - 1) {
        if (testResults.titleParts[l - 1]) {
          assertionArr.push({ testAttr: `titleParts-${index + 1}-chevron`, text: '' })
          assertionArr.push({ testAttr: `titleParts-${index + 1}-title`, text: testResults.titleParts[l - 1].slice(0, finalPartLength - 15) })
          assertionArr.push({ testAttr: `titleParts-${index + 2}-title`, text: testResults.titleParts[l - 1].slice(finalPartLength - 15) })
        }
      } else {
        if (index === 0) {
          assertionArr.push({ testAttr: `titleParts-${index}-title`, text: title })
          assertionArr.push({ testAttr: `titleParts-${index + 1}-chevron`, text: '' })
          assertionArr.push({ testAttr: `titleParts-1-title`, text: '...' })
        } else {
          assertionArr.push({ testAttr: `titleParts-${index + 1}-chevron`, text: '' })
          assertionArr.push({ testAttr: `titleParts-${index + 1}-title`, text: title })
        }
      }
    })
  }

  cy.get('[data-cy*=titleParts]').each((ele, index) => {
    const { testAttr, text } = assertionArr[index]

    cy.findByTestId(testAttr).should('contain.text', text)
  })
}

describe('<DebugFailedTest/>', () => {
  it('mounts correctly', () => {
    const testResult: TestResults = {
      id: '676df87878',
      titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
      instance: instance1,
    }

    cy.mount(() => (
      <div data-cy="test-group">
        <DebugFailedTest failedTestsResult={[testResult]} groups={[group1]} expandable={false}/>
      </div>
    ))

    cy.findByTestId('test-row').children().should('have.length', 6)
    cy.findByTestId('failed-icon').should('be.visible')
    assertRowContents(testResult)

    cy.findByTestId('test-group').realHover()
    cy.findByTestId('debug-artifacts').should('be.visible').children().should('have.length', 4)
    cy.findByTestId('debug-artifacts').children().each((artifact) => {
      cy.wrap(artifact).find('a').should('have.attr', 'href')
      .and('match', /utm_medium/)
      .and('match', /utm_campaign/)
      .and('match', /utm_source/)
    })
  })

  it('contains multiple titleParts segments', { viewportWidth: 1200 }, () => {
    const multipleTitleParts: TestResults = {
      id: '676df87878',
      titleParts: ['Login', 'Describe', 'it', 'context', 'Should redirect unauthenticated user to signin page'],
      instance: instance1,
    }

    cy.mount(() => (
      <DebugFailedTest failedTestsResult={[multipleTitleParts]} groups={[group1]} expandable={false}/>
    ))

    assertRowContents(multipleTitleParts)
  })

  it('tests multiple groups', { viewportWidth: 1200 }, () => {
    const testResults: TestResults[] = [
      {
        id: '676df87878',
        titleParts: ['Login', 'Describe', 'it', 'context', 'Should redirect unauthenticated user to signin page'],
        instance: instance1,
      },
      {
        id: '676df87878',
        titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
        instance: instance2,
      },
    ]

    cy.mount(() => (
      <div data-cy="test-group">
        <DebugFailedTest failedTestsResult={testResults} groups={[group1, group2]} expandable={true}/>
      </div>
    ))

    cy.findByTestId('test-group').realHover()
    cy.findByTestId('debug-artifacts').should('not.exist')
    cy.findAllByTestId('grouped-row').should('have.length', 2)
    cy.findAllByTestId('grouped-row').first().realHover()
    cy.findAllByTestId('debug-artifacts').first().should('be.visible').children().should('have.length', 4)
    cy.percySnapshot()
  })

  it('tests responsive UI', { viewportWidth: 700 }, () => {
    const testResult: TestResults = {
      id: '676df87874',
      titleParts: ['Test content', 'Test content 2', 'Test content 3', 'Test content 4', 'onMount() should be called once', 'hook() should be called twice and then'],
      instance: instance1,
    }

    cy.mount(() => (
      <div data-cy="test-group">
        <DebugFailedTest failedTestsResult={[testResult]} groups={[group1]} expandable={false}/>
      </div>
    ))

    assertRowContents(testResult)

    cy.contains('...').realHover()
    cy.contains('[data-cy=tooltip-content]', 'Test content 2 > Test content 3 > Test content 4').should('be.visible')
  })

  it('conditionally renders artifacts', () => {
    const render = (testResult: TestResults) => cy.mount(() =>
      (<div data-cy="test-group">
        <DebugFailedTest failedTestsResult={[testResult]} groups={[group1]} expandable={false}/>
      </div>))

    const testResult: TestResults = {
      id: '676df87874',
      titleParts: ['Test content', 'Test content 2', 'Test content 3', 'Test content 4', 'onMount() should be called once', 'hook() should be called twice and then'],
      instance: instance1,
    }

    const artifactFreeInstance: TestResults['instance'] = {
      ...instance1,
      hasStdout: false,
      hasScreenshots: false,
      hasVideo: false,
      hasReplay: false,
    }

    render({ ...testResult, instance: artifactFreeInstance })
    cy.findByTestId('debug-artifacts').children().should('have.length', 0)

    render({ ...testResult, instance: { ...artifactFreeInstance, hasStdout: true } })
    cy.findByTestId('debug-artifacts').children().should('have.length', 1)
    cy.findByTestId('TERMINAL_LOG-button').should('exist')

    render({ ...testResult, instance: { ...artifactFreeInstance, hasScreenshots: true } })
    cy.findByTestId('debug-artifacts').children().should('have.length', 1)
    cy.findByTestId('IMAGE_SCREENSHOT-button').should('exist')

    render({ ...testResult, instance: { ...artifactFreeInstance, hasVideo: true } })
    cy.findByTestId('debug-artifacts').children().should('have.length', 1)
    cy.findByTestId('PLAY-button').should('exist')

    render({ ...testResult, instance: { ...artifactFreeInstance, hasReplay: true } })
    cy.findByTestId('debug-artifacts').children().should('have.length', 1)
    cy.findByTestId('REPLAY-button').should('exist')

    render({ ...testResult, instance: instance1 })
    cy.findByTestId('debug-artifacts').children()
    .should('have.length', 4)
    .first()
    .should('have.attr', 'data-cy', 'artifact--REPLAY')
    .next()
    .should('have.attr', 'data-cy', 'artifact--TERMINAL_LOG')
    .next()
    .should('have.attr', 'data-cy', 'artifact--IMAGE_SCREENSHOT')
    .next()
    .should('have.attr', 'data-cy', 'artifact--PLAY')
  })
})
