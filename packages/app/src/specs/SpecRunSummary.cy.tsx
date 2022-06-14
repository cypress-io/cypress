import SpecRunSummary from './SpecRunSummary.vue'
import { exampleRuns } from '@packages/frontend-shared/cypress/support/mock-graphql/fakeCloudSpecRun'

describe('<SpecRunSummary />', { keystrokeDelay: 0 }, () => {
  const runs = exampleRuns()

  function mountWithRun (run) {
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
      cy.findByTestId('spec-run-summary')
      // Green border at top
      .should('have.css', 'border-top', '4px solid rgb(31, 169, 113)')

      cy.findByTestId('spec-run-filename').should('have.text', 'mySpecFile.spec.ts')

      cy.findByTestId('spec-run-status')
      // Green text with expected status text
      .should('have.css', 'color', 'rgb(0, 129, 77)')
      .and('have.text', 'Passed')

      cy.findByTestId('spec-run-time-ago')
      .should('have.text', '1 year ago')

      cy.findByTestId('spec-run-duration-1')
      .should('have.text', '2:23')

      cy.findByTestId('spec-run-duration-2')
      .should('have.text', '2:39')

      cy.findByTestId('spec-run-result-counts').should('be.visible')
    })
  })

  context('failed', () => {
    beforeEach(() => {
      mountWithRun(runs[1])
    })

    it('should render expected content', () => {
      cy.findByTestId('spec-run-summary')
      // Green border at top
      .should('have.css', 'border-top', '4px solid rgb(228, 87, 112)')

      cy.findByTestId('spec-run-filename').should('have.text', 'mySpecFile.spec.ts')

      cy.findByTestId('spec-run-status')
      // Green text with expected status text
      .should('have.css', 'color', 'rgb(198, 43, 73)')
      .and('have.text', 'Failed')

      cy.findByTestId('spec-run-time-ago')
      .should('have.text', '1 year ago')

      cy.findByTestId('spec-run-duration-1')
      .should('have.text', '1:02:40')

      cy.findByTestId('spec-run-duration-2').should('not.exist')

      cy.findByTestId('spec-run-result-counts').should('be.visible')
    })
  })

  context('canceled', () => {
    beforeEach(() => {
      mountWithRun(runs[2])
    })

    it('should render expected content', () => {
      cy.findByTestId('spec-run-summary')
      // Green border at top
      .should('have.css', 'border-top', '4px solid rgb(144, 149, 173)')

      cy.findByTestId('spec-run-filename').should('have.text', 'mySpecFile.spec.ts')

      cy.findByTestId('spec-run-status')
      // Green text with expected status text
      .should('have.css', 'color', 'rgb(90, 95, 122)')
      .and('have.text', 'Canceled')

      cy.findByTestId('spec-run-time-ago')
      .should('have.text', '1 year ago')

      cy.findByTestId('spec-run-duration-1')
      .should('have.text', '2:23')

      cy.findByTestId('spec-run-duration-2')
      .should('have.text', '2:39')

      cy.findByTestId('spec-run-result-counts').should('be.visible')
    })
  })

  context('errored', () => {
    beforeEach(() => {
      mountWithRun(runs[3])
    })

    it('should render expected content', () => {
      cy.findByTestId('spec-run-summary')
      // Green border at top
      .should('have.css', 'border-top', '4px solid rgb(219, 121, 3)')

      cy.findByTestId('spec-run-filename').should('have.text', 'mySpecFile.spec.ts')

      cy.findByTestId('spec-run-status')
      // Green text with expected status text
      .should('have.css', 'color', 'rgb(189, 88, 0)')
      .and('have.text', 'Errored')

      cy.findByTestId('spec-run-time-ago')
      .should('have.text', '1 year ago')

      cy.findByTestId('spec-run-duration-1')
      .should('have.text', '1:02:40')

      cy.findByTestId('spec-run-duration-2')
      .should('have.text', '10:26:40')

      cy.findByTestId('spec-run-result-counts').should('be.visible')
    })
  })

  context('no tests', () => {
    beforeEach(() => {
      mountWithRun(runs[4])
    })

    it('should render expected content', () => {
      cy.findByTestId('spec-run-summary')
      // Green border at top
      .should('have.css', 'border-top', '4px solid rgb(144, 149, 173)')

      cy.findByTestId('spec-run-filename').should('have.text', 'mySpecFile.spec.ts')

      cy.findByTestId('spec-run-status')
      // Green text with expected status text
      .should('have.css', 'color', 'rgb(90, 95, 122)')
      .and('have.text', 'No tests')

      cy.findByTestId('spec-run-time-ago')
      .should('have.text', '1 year ago')

      cy.findByTestId('spec-run-duration-1')
      .should('have.text', '2:23')

      cy.findByTestId('spec-run-duration-2')
      .should('have.text', '2:39')

      cy.findByTestId('spec-run-result-counts').should('be.visible')
    })
  })

  context('over limit', () => {
    beforeEach(() => {
      mountWithRun(runs[5])
    })

    it('should render expected content', () => {
      cy.findByTestId('spec-run-summary')
      // Green border at top
      .should('have.css', 'border-top', '4px solid rgb(219, 121, 3)')

      cy.findByTestId('spec-run-filename').should('have.text', 'mySpecFile.spec.ts')

      cy.findByTestId('spec-run-status')
      // Green text with expected status text
      .should('have.css', 'color', 'rgb(189, 88, 0)')
      .and('have.text', 'Over limit')

      cy.findByTestId('spec-run-time-ago')
      .should('have.text', '1 year ago')

      cy.findByTestId('spec-run-duration-1')
      .should('have.text', '2:23')

      cy.findByTestId('spec-run-duration-2')
      .should('have.text', '2:39')

      cy.findByTestId('spec-run-result-counts').should('be.visible')
    })
  })

  context('running', () => {
    beforeEach(() => {
      mountWithRun(runs[6])
    })

    it('should render expected content', () => {
      cy.findByTestId('spec-run-summary')
      // Green border at top
      .should('have.css', 'border-top', '4px solid rgb(100, 112, 243)')

      cy.findByTestId('spec-run-filename').should('have.text', 'mySpecFile.spec.ts')

      cy.findByTestId('spec-run-status')
      // Green text with expected status text
      .should('have.css', 'color', 'rgb(73, 86, 227)')
      .and('have.text', 'Running')

      cy.findByTestId('spec-run-time-ago')
      .should('have.text', '1 year ago')

      cy.findByTestId('spec-run-duration-1')
      .should('have.text', '2:23')

      cy.findByTestId('spec-run-duration-2')
      .should('have.text', '2:39')

      cy.findByTestId('spec-run-result-counts').should('be.visible')
    })
  })

  context('timed out', () => {
    beforeEach(() => {
      mountWithRun(runs[7])
    })

    it('should render expected content', () => {
      cy.findByTestId('spec-run-summary')
      // Green border at top
      .should('have.css', 'border-top', '4px solid rgb(219, 121, 3)')

      cy.findByTestId('spec-run-filename').should('have.text', 'mySpecFile.spec.ts')

      cy.findByTestId('spec-run-status')
      // Green text with expected status text
      .should('have.css', 'color', 'rgb(189, 88, 0)')
      .and('have.text', 'Timed out')

      cy.findByTestId('spec-run-time-ago')
      .should('have.text', '1 year ago')

      cy.findByTestId('spec-run-duration-1')
      .should('have.text', '2:23')

      cy.findByTestId('spec-run-duration-2')
      .should('have.text', '2:39')

      cy.findByTestId('spec-run-result-counts').should('be.visible')
    })
  })
})
