import { DebugSpecListGroupsFragment, DebugSpecListSpecFragment, DebugSpecListTestsFragment, DebugSpecsFragmentDoc } from '../generated/graphql-test'
import DebugContainer from './DebugContainer.vue'
import { defaultMessages } from '@cy/i18n'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { specsList } from './utils/DebugMapping'
import { CloudRunStubs } from '@packages/graphql/test/stubCloudTypes'

describe('<DebugContainer />', () => {
  context('empty states', () => {
    const validateEmptyState = (expectedMessages: string[]) => {
      cy.mountFragment(DebugSpecsFragmentDoc, {
        render: (gqlVal) => <DebugContainer gql={gqlVal} />,
      })

      expectedMessages.forEach((message) => {
        cy.findByTestId('debug-empty').contains(message)
      })
    }

    it('shows not logged in', () => {
      validateEmptyState([defaultMessages.debugPage.emptyStates.connectToCypressCloud, defaultMessages.debugPage.emptyStates.debugDirectlyInCypress, defaultMessages.debugPage.emptyStates.notLoggedInTestMessage])
      cy.findByRole('button', { name: 'Connect to Cypress Cloud' }).should('be.visible')
    })

    it('is logged in with no project', () => {
      const loginConnectStore = useLoginConnectStore()

      loginConnectStore.setUserFlag('isLoggedIn', true)
      loginConnectStore.setProjectFlag('isProjectConnected', false)

      validateEmptyState([defaultMessages.debugPage.emptyStates.debugDirectlyInCypress, defaultMessages.debugPage.emptyStates.reviewRerunAndDebug, defaultMessages.debugPage.emptyStates.noProjectTestMessage])
      cy.findByRole('button', { name: 'Connect a Cypress Cloud project' }).should('be.visible')
    })

    it('has no runs', () => {
      const loginConnectStore = useLoginConnectStore()

      loginConnectStore.setUserFlag('isLoggedIn', true)
      loginConnectStore.setProjectFlag('isProjectConnected', true)
      cy.mountFragment(DebugSpecsFragmentDoc, {
        render: (gqlVal) => <DebugContainer gql={gqlVal} />,
      })

      validateEmptyState([defaultMessages.debugPage.emptyStates.recordYourFirstRun, defaultMessages.debugPage.emptyStates.almostThere, defaultMessages.debugPage.emptyStates.noRunsTestMessage])
      cy.findByDisplayValue('npx cypress run --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa').should('be.visible')
    })

    it('errors', () => {
      const loginConnectStore = useLoginConnectStore()

      loginConnectStore.setUserFlag('isLoggedIn', true)
      loginConnectStore.setProjectFlag('isProjectConnected', true)
      cy.mountFragment(DebugSpecsFragmentDoc, {
        render: (gqlVal) => <DebugContainer gql={gqlVal} showError={true} />,
      })

      cy.findByTestId('debug-empty').should('not.exist')
      cy.findByTestId('debug-alert').should('be.visible')
    })
  })

  describe('when logged in and connected', () => {
    let loginConnectStore

    beforeEach(() => {
      loginConnectStore = useLoginConnectStore()

      loginConnectStore.setUserFlag('isLoggedIn', true)
      loginConnectStore.setProjectFlag('isProjectConnected', true)
    })

    it('render first pending run', () => {
      cy.mountFragment(DebugSpecsFragmentDoc, {
        onResult: (result) => {
          if (result.currentProject?.cloudProject?.__typename === 'CloudProject') {
            const test = result.currentProject.cloudProject.runByNumber
            const other = CloudRunStubs.running as typeof test

            other!.runNumber = 1

            result.currentProject.cloudProject.runByNumber = other
          }
        },
        render: (gqlVal) => <DebugContainer gql={gqlVal} />,
      })

      cy.findByTestId('debug-header').should('be.visible')
      cy.findByTestId('debug-pending-splash')
      .should('be.visible')
      .within(() => {
        cy.findByTestId('debug-pending-counts').should('have.text', '8 of 10 specs completed')
      })
    })

    it('renders specs and tests when completed run available', () => {
      cy.mountFragment(DebugSpecsFragmentDoc, {
        onResult: (result) => {
          if (result.currentProject?.cloudProject?.__typename === 'CloudProject') {
            const test = result.currentProject.cloudProject.runByNumber
            const other = CloudRunStubs.failingWithTests as typeof test

            result.currentProject.cloudProject.runByNumber = other
          }
        },
        render: (gqlVal) => <DebugContainer gql={gqlVal} />,
      })

      // Only asserting that it is rendering the components for failed specs
      cy.findByTestId('debug-header').should('be.visible')
      cy.findByTestId('debug-spec-item').should('be.visible')
    })

    context('newer relevant run available', () => {
      it('displays newer run with progress when running', () => {
        cy.mountFragment(DebugSpecsFragmentDoc, {
          onResult: (result) => {
            if (result.currentProject?.cloudProject?.__typename === 'CloudProject') {
              const test = result.currentProject.cloudProject.runByNumber
              const other = CloudRunStubs.failingWithTests as typeof test

              result.currentProject.cloudProject.runByNumber = other
            }
          },
          render: (gqlVal) => <DebugContainer gql={gqlVal} />,
        })

        cy.findByTestId('newer-relevant-run')
        .should('be.visible')
        .and('contain.text', 'fix: make gql work FAILED')
        .and('contain.text', '8 of 10 runs completed')
      })

      it('displays newer run with link when complete', () => {
        cy.mountFragment(DebugSpecsFragmentDoc, {
          onResult: (result) => {
            if (result.currentProject?.cloudProject?.__typename === 'CloudProject') {
              const test = result.currentProject.cloudProject.runByNumber
              const other = CloudRunStubs.failingWithTests as typeof test

              result.currentProject.cloudProject.runByNumber = other
            }
          },
          render: (gqlVal) => <DebugContainer gql={gqlVal} />,
        })

        cy.findByTestId('newer-relevant-run')
        .should('be.visible')
        .and('contain.text', 'fix: make gql work FAILED')
        .and('contain.text', 'View run')
      })
    })
  })

  describe('testing util function: debugMapping', () => {
    it('maps correctly for a single spec', () => {
      const specs = [
        { id: 'a1c', groupIds: ['a'] },
      ] as DebugSpecListSpecFragment[]
      const tests = [
        { specId: 'a1c', id: 'random1' },
        { specId: 'a1c', id: 'random2' },
      ] as DebugSpecListTestsFragment[]
      const groups = [
        { id: 'a', testingType: 'e2e' },
        { id: 'b', testingType: 'e2e' },
      ] as DebugSpecListGroupsFragment[]

      const debugMappingArray = specsList({ specs, tests, groups, localSpecs: [], currentTestingType: 'e2e' })

      expect(debugMappingArray).to.have.length(1)
      expect(debugMappingArray[0]).to.deep.equal({ spec: { id: 'a1c', groupIds: ['a'] }, tests: [{ specId: 'a1c', id: 'random1' }, { specId: 'a1c', id: 'random2' }], groups: [{ id: 'a', testingType: 'e2e' }], foundLocally: false, testingType: 'e2e', matchesCurrentTestingType: true })
    })

    it('maps correctly for multiple specs and test', () => {
      const specs = [
        { id: '123', groupIds: ['a'] },
        { id: '456', groupIds: ['b'] },
        { id: '789', groupIds: ['a', 'b'] },
      ] as DebugSpecListSpecFragment[]
      const tests = [
        { specId: '123', id: 'random1' },
        { specId: '456', id: 'random2' },
        { specId: '456', id: 'random3' },
        { specId: '789', id: 'random4' },
        { specId: '123', id: 'random6' },
      ] as DebugSpecListTestsFragment[]
      const groups = [
        { id: 'a', testingType: 'e2e' },
        { id: 'b', testingType: 'e2e' },
      ] as DebugSpecListGroupsFragment[]

      const debugMappingArray = specsList({ specs, tests, localSpecs: [], currentTestingType: 'e2e', groups })

      const expected = [
        { spec: { id: '123', groupIds: ['a'] }, tests: [{ specId: '123', id: 'random1' }, { specId: '123', id: 'random6' }], groups: [{ id: 'a', testingType: 'e2e' }], foundLocally: false, testingType: 'e2e', matchesCurrentTestingType: true },
        { spec: { id: '456', groupIds: ['b'] }, tests: [{ specId: '456', id: 'random2' }, { specId: '456', id: 'random3' }], groups: [{ id: 'b', testingType: 'e2e' }], foundLocally: false, testingType: 'e2e', matchesCurrentTestingType: true },
        { spec: { id: '789', groupIds: ['a', 'b'] }, tests: [{ specId: '789', id: 'random4' }], groups: [{ id: 'a', testingType: 'e2e' }, { id: 'b', testingType: 'e2e' }], foundLocally: false, testingType: 'e2e', matchesCurrentTestingType: true },
      ]

      expect(debugMappingArray).to.deep.equal(expected)
    })

    it('maps does not show specs that do not have tests', () => {
      const specs = [
        { id: '123', groupIds: ['a'] },
        { id: '456', groupIds: ['a'] },
        { id: '789', groupIds: ['a'] },
      ] as DebugSpecListSpecFragment[]
      const tests = [{ specId: '123', id: 'random1' }] as DebugSpecListTestsFragment[]
      const groups = [{ id: 'a', testingType: 'e2e' }] as DebugSpecListGroupsFragment[]

      const debugMappingArray = specsList({ specs, tests, localSpecs: [], currentTestingType: 'e2e', groups })

      expect(debugMappingArray).to.have.length(1)
      expect(debugMappingArray).to.deep.equal([{ spec: { id: '123', groupIds: ['a'] }, tests: [{ specId: '123', id: 'random1' }], groups: [{ id: 'a', testingType: 'e2e' }], foundLocally: false, testingType: 'e2e', matchesCurrentTestingType: true }])
    })

    it('throws an error when a test does not map to a spec', () => {
      const specs = [
        { id: '123', groupIds: ['a'] },
      ] as DebugSpecListSpecFragment[]
      const tests = [
        { specId: '123', id: 'random1' },
        { specId: '456', id: 'random2' },
      ] as DebugSpecListTestsFragment[]
      const groups = [{ id: 'a' }] as DebugSpecListGroupsFragment[]

      const specsListWrapper = () => {
        return specsList({ specs, tests, groups, localSpecs: [], currentTestingType: 'e2e' })
      }

      expect(specsListWrapper).to.throw('Could not find spec for id 456')
    })
  })
})
