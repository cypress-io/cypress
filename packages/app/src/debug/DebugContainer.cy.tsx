import { DebugSpecListGroupsFragment, DebugSpecListSpecFragment, DebugSpecListTestsFragment, DebugSpecsFragmentDoc } from '../generated/graphql-test'
import DebugContainer from './DebugContainer.vue'
import { defaultMessages } from '@cy/i18n'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { specsList } from './utils/DebugMapping'
import { CloudRunStubs } from '@packages/graphql/test/stubCloudTypes'

describe('<DebugContainer />', () => {
  before(() => {
    (window as any).CYPRESS_RUN_TESTING_TYPE = 'e2e'
  })

  context('empty states', () => {
    const validateEmptyState = (expectedMessage: string) => {
      cy.mountFragment(DebugSpecsFragmentDoc, {
        render: (gqlVal) => {
          return (
            <DebugContainer
              gql={gqlVal}
            />
          )
        },
      })

      cy.findByTestId('debug-empty').contains(expectedMessage)
    }

    it('shows not logged in', () => {
      validateEmptyState(defaultMessages.debugPage.notLoggedIn)
    })

    it('is logged in', () => {
      const loginConnectStore = useLoginConnectStore()

      loginConnectStore.setUserFlag('isLoggedIn', true)

      validateEmptyState(defaultMessages.debugPage.notConnected)
    })

    it('has no runs', () => {
      const loginConnectStore = useLoginConnectStore()

      loginConnectStore.setUserFlag('isLoggedIn', true)
      loginConnectStore.setProjectFlag('isProjectConnected', true)
      cy.mountFragment(DebugSpecsFragmentDoc, {
        render: (gqlVal) => {
          return (
            <DebugContainer
              gql={gqlVal}
            />
          )
        },
      })

      cy.findByTestId('debug-empty').contains(defaultMessages.debugPage.noRuns)
    })
  })

  describe('render specs and tests', () => {
    it('renders data when logged in and connected', () => {
      const loginConnectStore = useLoginConnectStore()

      loginConnectStore.setUserFlag('isLoggedIn', true)
      loginConnectStore.setProjectFlag('isProjectConnected', true)
      cy.mountFragment(DebugSpecsFragmentDoc, {
        onResult: (result) => {
          if (result.currentProject?.cloudProject?.__typename === 'CloudProject') {
            const test = result.currentProject.cloudProject.runByNumber
            const other = CloudRunStubs.failingWithTests as typeof test

            result.currentProject.cloudProject.runByNumber = other
          }
        },
        render: (gqlVal) => {
          return (
            <DebugContainer
              gql={gqlVal}
            />
          )
        },
      })

      // Only asserting that it is rendering the components for failed specs
      cy.findByTestId('debug-header').should('be.visible')
      cy.findByTestId('debug-spec-item').should('be.visible')
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
        { id: 'a' },
        { id: 'b' },
      ] as DebugSpecListGroupsFragment[]

      const debugMappingArray = specsList({ specs, tests, groups, localSpecs: [], currentTestingType: 'e2e' })

      expect(debugMappingArray).to.have.length(1)
      expect(debugMappingArray[0]).to.deep.equal({ spec: { id: 'a1c', groupIds: ['a'] }, tests: [{ specId: 'a1c', id: 'random1' }, { specId: 'a1c', id: 'random2' }], groups: [{ id: 'a' }], foundLocally: false, testingType: 'e2e', matchesCurrentTestingType: true })
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
        { id: 'a' },
        { id: 'b' },
      ] as DebugSpecListGroupsFragment[]

      const debugMappingArray = specsList({ specs, tests, localSpecs: [], currentTestingType: 'e2e', groups })

      const expected = [
        { spec: { id: '123', groupIds: ['a'] }, tests: [{ specId: '123', id: 'random1' }, { specId: '123', id: 'random6' }], groups: [{ id: 'a' }], foundLocally: false, testingType: 'e2e', matchesCurrentTestingType: true },
        { spec: { id: '456', groupIds: ['b'] }, tests: [{ specId: '456', id: 'random2' }, { specId: '456', id: 'random3' }], groups: [{ id: 'b' }], foundLocally: false, testingType: 'e2e', matchesCurrentTestingType: true },
        { spec: { id: '789', groupIds: ['a', 'b'] }, tests: [{ specId: '789', id: 'random4' }], groups: [{ id: 'a' }, { id: 'b' }], foundLocally: false, testingType: 'e2e', matchesCurrentTestingType: true },
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
      const groups = [{ id: 'a' }] as DebugSpecListGroupsFragment[]

      const debugMappingArray = specsList({ specs, tests, localSpecs: [], currentTestingType: 'e2e', groups })

      expect(debugMappingArray).to.have.length(1)
      expect(debugMappingArray).to.deep.equal([{ spec: { id: '123', groupIds: ['a'] }, tests: [{ specId: '123', id: 'random1' }], groups: [{ id: 'a' }], foundLocally: false, testingType: 'e2e', matchesCurrentTestingType: true }])
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
