import type { RunStatusDotsFragment } from '../generated/graphql'
import RunStatusDots from './RunStatusDots.vue'
import { fakeRuns } from '@packages/frontend-shared/cypress/support/mock-graphql/fakeCloudSpecRun'
import { fill } from 'lodash'
import type { CloudSpecRun } from '@packages/graphql/src/gen/cloud-source-types.gen'

function mountWithRuns (runs: Required<CloudSpecRun>[]) {
  const gql: RunStatusDotsFragment = {
    id: 'id',
    data: {
      __typename: 'CloudProjectSpec',
      retrievedAt: new Date().toISOString(),
      id: 'id',
      specRunsForRunIds: [
        ...runs as any, // suppress TS compiler
      ],
    },
  }

  cy.mount(() => {
    return (
      <div class="flex justify-center">
        <RunStatusDots gql={gql} specFileExtension=".cy.ts" specFileName="spec"/>
      </div>
    )
  })
}

function mountWithNoData () {
  cy.mount(() => {
    return (
      <div class="flex justify-center">
        <RunStatusDots gql={null} specFileExtension=".cy.ts" specFileName="spec"/>
      </div>
    )
  })
}

describe('<RunStatusDots />', () => {
  context('runs scenario 1', () => {
    beforeEach(() => {
      const runs = fakeRuns(['PASSED', 'FAILED', 'CANCELLED', 'ERRORED'])

      mountWithRuns(runs)
    })

    it('renders as expected', () => {
      cy.findByTestId('run-status-dots').trigger('mouseenter')
      cy.get('.v-popper__popper--shown').contains('spec.cy.ts')
      cy.findAllByTestId('run-status-dot-0').should('have.class', 'icon-light-orange-400')
      cy.findAllByTestId('run-status-dot-1').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-2').should('have.class', 'icon-light-red-400')
      cy.findAllByTestId('run-status-dot-latest').should('not.have.class', 'animate-spin')
    })
  })

  context('runs scenario 2', () => {
    beforeEach(() => {
      const runs = fakeRuns(['NOTESTS', 'UNCLAIMED', 'RUNNING', 'TIMEDOUT'])

      mountWithRuns(runs)
    })

    it('renders as expected', () => {
      cy.findByTestId('run-status-dots').trigger('mouseenter')
      cy.get('.v-popper__popper--shown').contains('spec.cy.ts')
      cy.findAllByTestId('run-status-dot-0').should('have.class', 'icon-light-orange-400')
      cy.findAllByTestId('run-status-dot-1').should('have.class', 'icon-light-indigo-400')
      cy.findAllByTestId('run-status-dot-2').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-latest').should('not.have.class', 'animate-spin')
    })
  })

  context('single RUNNING status', () => {
    beforeEach(() => {
      const runs = fakeRuns(['RUNNING'])

      mountWithRuns(runs)
    })

    it('renders as expected', () => {
      cy.findByTestId('run-status-dots').trigger('mouseenter')
      cy.get('.v-popper__popper--shown').contains('spec.cy.ts')
      cy.findAllByTestId('run-status-dot-0').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-1').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-2').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-latest').should('have.class', 'animate-spin')
    })
  })

  context('single UNCLAIMED status', () => {
    beforeEach(() => {
      const runs = fakeRuns(['UNCLAIMED'])

      mountWithRuns(runs)
    })

    it('renders as expected', () => {
      cy.findByTestId('run-status-dots').trigger('mouseenter')
      cy.get('.v-popper__popper--shown').contains('spec.cy.ts')
      cy.findAllByTestId('run-status-dot-0').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-1').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-2').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-latest').should('not.have.class', 'animate-spin')
    })
  })

  context('no runs', () => {
    beforeEach(() => {
      mountWithRuns([])
    })

    it('renders placeholder without tooltip or link', () => {
      cy.findByTestId('external').should('not.exist')
      cy.findByTestId('run-status-dots').trigger('mouseenter')
      cy.get('.v-popper__popper--shown').should('not.exist')
    })
  })

  context('runs not loaded', () => {
    beforeEach(() => {
      mountWithNoData()
    })

    it('renders placeholder without tooltip or link', () => {
      cy.findByTestId('external').should('not.exist')
      cy.findByTestId('run-status-empty').contains('--')
      cy.findByTestId('run-status-empty').trigger('mouseenter')
      cy.get('.v-popper__popper--shown').should('not.exist')
      cy.findByTestId('run-status-dots').should('not.exist')
    })
  })

  context('unknown/unhandled statuses', () => {
    beforeEach(() => {
      const runs = fakeRuns(fill(['', '', '', ''], 'FAKE_UNKNOWN_STATUS' as any))

      mountWithRuns(runs)
    })

    it('renders as expected', () => {
      cy.findByTestId('run-status-dots').trigger('mouseenter')
      cy.get('.v-popper__popper--shown').contains('spec.cy.ts')
      cy.findAllByTestId('run-status-dot-0').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-1').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-2').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-latest').should('not.have.class', 'animate-spin')
    })
  })

  it('builds href with UTM params', () => {
    const runs = fakeRuns(['PASSED'])

    mountWithRuns(runs)

    cy.get('a')
    .should('have.attr', 'href')
    .and('contain', 'utm_campaign=PASSED')
  })
})
