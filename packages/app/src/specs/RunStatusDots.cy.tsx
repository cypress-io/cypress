import type { RunStatusDotsFragment } from '../generated/graphql'
import RunStatusDots from './RunStatusDots.vue'
import { fakeRuns } from '@packages/frontend-shared/cypress/support/mock-graphql/fakeCloudSpecRun'

function mountWithGql (gql: RunStatusDotsFragment) {
  cy.mount(() => {
    return (
      <div class="flex justify-center">
        <RunStatusDots gql={gql} specFileExtension=".cy.ts" specFileName="spec"/>
      </div>
    )
  })
}

describe('<RunStatusDots />', () => {
  it('mounts correctly for example scenario 1', () => {
    const runs = fakeRuns(['PASSED', 'FAILED', 'CANCELLED', 'ERRORED'])
    const gql: RunStatusDotsFragment = {
      id: 'id',
      data: {
        __typename: 'CloudProjectSpec',
        retrievedAt: new Date().toISOString(),
        id: 'id',
        specRuns: {
          nodes: [
            ...runs as any, // suppress TS compiler
          ],
        },
      },
    }

    mountWithGql(gql)

    cy.findByTestId('run-status-dots').trigger('mouseenter')
    cy.get('.v-popper__popper--shown').contains('spec.cy.ts')
    cy.findAllByTestId('run-status-dot-0').should('have.class', 'icon-light-orange-400')
    cy.findAllByTestId('run-status-dot-1').should('have.class', 'icon-light-gray-300')
    cy.findAllByTestId('run-status-dot-2').should('have.class', 'icon-light-red-400')
    cy.findAllByTestId('run-status-dot-latest').should('not.have.class', 'animate-spin')
  })

  it('mounts correctly for example scenario 2', () => {
    const runs = fakeRuns(['NOTESTS', 'OVERLIMIT', 'RUNNING', 'TIMEDOUT'])

    const gql: RunStatusDotsFragment = {
      id: 'id',
      data: {
        __typename: 'CloudProjectSpec',
        id: 'id',
        retrievedAt: new Date().toISOString(),
        specRuns: {
          nodes: [
            ...runs as any, // suppress TS compiler
          ],
        },
      },
    }

    mountWithGql(gql)

    cy.findByTestId('run-status-dots').trigger('mouseenter')
    cy.get('.v-popper__popper--shown').contains('spec.cy.ts')
    cy.findAllByTestId('run-status-dot-0').should('have.class', 'icon-light-orange-400')
    cy.findAllByTestId('run-status-dot-1').should('have.class', 'icon-light-indigo-400')
    cy.findAllByTestId('run-status-dot-2').should('have.class', 'icon-light-orange-400')
    cy.findAllByTestId('run-status-dot-latest').should('not.have.class', 'animate-spin')
  })

  it('mounts correctly for example scenario 3', () => {
    const runs = fakeRuns(['RUNNING'])

    const gql: RunStatusDotsFragment = {
      id: 'id',
      data: {
        __typename: 'CloudProjectSpec',
        id: 'id',
        retrievedAt: new Date().toISOString(),
        specRuns: {
          nodes: [
            ...runs as any, // suppress TS compiler
          ],
        },
      },
    }

    mountWithGql(gql)

    cy.findByTestId('run-status-dots').trigger('mouseenter')
    cy.get('.v-popper__popper--shown').contains('spec.cy.ts')
    cy.findAllByTestId('run-status-dot-0').should('have.class', 'icon-light-gray-300')
    cy.findAllByTestId('run-status-dot-1').should('have.class', 'icon-light-gray-300')
    cy.findAllByTestId('run-status-dot-2').should('have.class', 'icon-light-gray-300')
    cy.findAllByTestId('run-status-dot-latest').should('have.class', 'animate-spin')
  })

  it('handles UNCLAIMED status', () => {
    const runs = fakeRuns(['UNCLAIMED'])

    const gql: RunStatusDotsFragment = {
      id: 'id',
      data: {
        __typename: 'CloudProjectSpec',
        id: 'id',
        retrievedAt: new Date().toISOString(),
        specRuns: {
          nodes: [
            ...runs as any, // suppress TS compiler
          ],
        },
      },
    }

    mountWithGql(gql)

    cy.findByTestId('run-status-dots').trigger('mouseenter')
    cy.get('.v-popper__popper--shown').contains('spec.cy.ts')
    cy.findAllByTestId('run-status-dot-0').should('have.class', 'icon-light-gray-300')
    cy.findAllByTestId('run-status-dot-1').should('have.class', 'icon-light-gray-300')
    cy.findAllByTestId('run-status-dot-2').should('have.class', 'icon-light-gray-300')
    cy.findAllByTestId('run-status-dot-latest').should('not.have.class', 'animate-spin')
  })

  it('renders placeholder without tooltip or link', () => {
    const gql: RunStatusDotsFragment = {
      id: 'id',
      data: {
        __typename: 'CloudProjectSpec',
        id: 'id',
        retrievedAt: new Date().toISOString(),
        specRuns: {
          nodes: [],
        },
      },
    }

    mountWithGql(gql)

    cy.findByTestId('external').should('not.exist')
    cy.findByTestId('run-status-dots').trigger('mouseenter')
    cy.get('.v-popper__popper--shown').should('not.exist')
  })
})
