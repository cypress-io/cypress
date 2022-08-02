import SpecRunSummary from './SpecRunSummary.vue'
import { exampleRuns } from '@packages/frontend-shared/cypress/support/mock-graphql/fakeCloudSpecRun'
import type { CloudSpecRun } from '@packages/graphql/src/gen/cloud-source-types.gen'

function validateTopBorder (color: string): void {
  cy.findByTestId('spec-run-summary')
  .should('have.css', 'border-top', `4px solid ${color}`)
}

function validateFilename (expected: string): void {
  cy.findByTestId('spec-filename').should('have.text', expected)
}

function validateTimeAgo (expected: string): void {
  cy.findByTestId('spec-run-time-ago')
  .should('have.text', expected)
}

function validateStatus (status: string, color: string): void {
  cy.findByTestId('spec-run-status')
  .should('have.css', 'color', color)
  .and('have.text', status)
}

function validateDuration1 (expected: string): void {
  cy.findByTestId('spec-run-duration-1')
  .should('have.text', expected)
}

function validateDuration2 (expected: string): void {
  cy.findByTestId('spec-run-duration-2')
  .should('have.text', expected)
}

function validateResultCountsVisible (): void {
  cy.findByTestId('spec-run-result-counts').should('be.visible')
}

describe('<SpecRunSummary />', { keystrokeDelay: 0 }, () => {
  const runs = exampleRuns()

  function mountWithRun (run: CloudSpecRun) {
    const createdAt = new Date()

    createdAt.setFullYear(createdAt.getFullYear() - 1)
    run.createdAt = createdAt.toISOString()
    cy.mount(<SpecRunSummary run={run} specFileNoExtension="mySpecFile" specFileExtension=".spec.ts" />)
  }

  context('passing', () => {
    beforeEach(() => {
      mountWithRun(runs[0])
    })

    it('should render expected content', () => {
      // Green border
      validateTopBorder('rgb(31, 169, 113)')
      validateFilename('mySpecFile.spec.ts')
      // Green text
      validateStatus('Passed', 'rgb(0, 129, 77)')
      validateTimeAgo('1 year ago')
      validateDuration1('2:23')
      validateDuration2('2:39')
      validateResultCountsVisible()
    })
  })

  context('failed', () => {
    beforeEach(() => {
      mountWithRun(runs[1])
    })

    it('should render expected content', () => {
      // Red border
      validateTopBorder('rgb(228, 87, 112)')
      validateFilename('mySpecFile.spec.ts')
      // Red text
      validateStatus('Failed', 'rgb(198, 43, 73)')
      validateTimeAgo('1 year ago')
      validateDuration1('1:02:40')
      cy.findByTestId('spec-run-duration-2').should('not.exist')
      validateResultCountsVisible()
    })
  })

  context('canceled', () => {
    beforeEach(() => {
      mountWithRun(runs[2])
    })

    it('should render expected content', () => {
      // Gray border
      validateTopBorder('rgb(144, 149, 173)')
      validateFilename('mySpecFile.spec.ts')
      // Gray text
      validateStatus('Canceled', 'rgb(90, 95, 122)')
      validateTimeAgo('1 year ago')
      validateDuration1('2:23')
      validateDuration2('2:39')
      validateResultCountsVisible()
    })
  })

  context('errored', () => {
    beforeEach(() => {
      mountWithRun(runs[3])
    })

    it('should render expected content', () => {
      // Orange border
      validateTopBorder('rgb(219, 121, 3)')
      validateFilename('mySpecFile.spec.ts')
      // Orange text
      validateStatus('Errored', 'rgb(189, 88, 0)')
      validateTimeAgo('1 year ago')
      validateDuration1('1:02:40')
      validateDuration2('10:26:40')
      validateResultCountsVisible()
    })
  })

  context('no tests', () => {
    beforeEach(() => {
      mountWithRun(runs[4])
    })

    it('should render expected content', () => {
      // Gray border
      validateTopBorder('rgb(144, 149, 173)')
      validateFilename('mySpecFile.spec.ts')
      validateStatus('No tests', 'rgb(90, 95, 122)')
      validateTimeAgo('1 year ago')
      validateDuration1('2:23')
      validateDuration2('2:39')
      validateResultCountsVisible()
    })
  })

  context('running', () => {
    beforeEach(() => {
      mountWithRun(runs[6])
    })

    it('should render expected content', () => {
      // Blue border
      validateTopBorder('rgb(100, 112, 243)')
      validateFilename('mySpecFile.spec.ts')
      // Blue text
      validateStatus('Running', 'rgb(73, 86, 227)')
      validateTimeAgo('1 year ago')
      validateDuration1('2:23')
      validateDuration2('2:39')
      validateResultCountsVisible()
    })
  })

  context('timed out', () => {
    beforeEach(() => {
      mountWithRun(runs[7])
    })

    it('should render expected content', () => {
      // Orange border
      validateTopBorder('rgb(219, 121, 3)')
      validateFilename('mySpecFile.spec.ts')
      // Orange text
      validateStatus('Timed out', 'rgb(189, 88, 0)')
      validateTimeAgo('1 year ago')
      validateDuration1('2:23')
      validateDuration2('2:39')
      validateResultCountsVisible()
    })
  })

  context('queued', () => {
    beforeEach(() => {
      mountWithRun(runs[8])
    })

    it('should render expected content', () => {
      // Gray border
      validateTopBorder('rgb(144, 149, 173)')
      validateFilename('mySpecFile.spec.ts')
      // Gray text
      validateStatus('Queued', 'rgb(90, 95, 122)')
      validateTimeAgo('1 year ago')
      validateDuration1('2:23')
      validateDuration2('2:39')
      validateResultCountsVisible()
    })
  })

  context('unhandled status', () => {
    beforeEach(() => {
      mountWithRun(runs[9])
    })

    it('should render expected content', () => {
      // Gray border
      validateTopBorder('rgb(144, 149, 173)')
      validateFilename('mySpecFile.spec.ts')

      // Should not render any status text
      cy.findByTestId('spec-run-status')
      .should('not.exist')

      validateTimeAgo('1 year ago')
      validateDuration1('2:23')
      validateDuration2('2:39')
      validateResultCountsVisible()
    })
  })
})
