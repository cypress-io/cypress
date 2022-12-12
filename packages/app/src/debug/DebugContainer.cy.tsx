import { DebugSpecsFragmentDoc } from '../generated/graphql-test'
import DebugContainer from './DebugContainer.vue'
import { defaultMessages } from '@cy/i18n'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { specsList } from './utils/DebugMapping'
import { CloudRunStubs } from '@packages/graphql/test/stubCloudTypes'

describe('<DebugContainer />', () => {
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
    const createSpecs = (idArr: string[]) => {
      const acc: {id: string}[] = []

      idArr.forEach((val) => {
        acc.push({ id: val })
      })

      return acc
    }

    it('maps correctly for a single spec', () => {
      const spec = createSpecs(['a1c'])
      const tests = [
        { specId: 'a1c', id: 'random1' },
        { specId: 'a1c', id: 'random2' },
      ]

      const debugMappingArray = specsList(spec, tests)

      expect(debugMappingArray).to.have.length(1)
      expect(debugMappingArray[0]).to.deep.equal({ spec: { id: 'a1c' }, tests: [{ specId: 'a1c', id: 'random1' }, { specId: 'a1c', id: 'random2' }] })
    })

    it('maps correctly for multiple specs and test', () => {
      const specs = createSpecs(['123', '456', '789'])
      const tests = [
        { specId: '123', id: 'random1' },
        { specId: '456', id: 'random2' },
        { specId: '456', id: 'random3' },
        { specId: '789', id: 'random4' },
        { specId: '123', id: 'random6' },
      ]

      const debugMappingArray = specsList(specs, tests)

      const expected = [
        { spec: { id: '123' }, tests: [{ specId: '123', id: 'random1' }, { specId: '123', id: 'random6' }] },
        { spec: { id: '456' }, tests: [{ specId: '456', id: 'random2' }, { specId: '456', id: 'random3' }] },
        { spec: { id: '789' }, tests: [{ specId: '789', id: 'random4' }] },
      ]

      expect(debugMappingArray).to.deep.equal(expected)
    })

    it('maps does not show specs that do not have tests', () => {
      const specs = createSpecs(['123', '456', '789'])
      const tests = [{ specId: '123', id: 'random1' }]

      const debugMappingArray = specsList(specs, tests)

      expect(debugMappingArray).to.have.length(1)
      expect(debugMappingArray).to.deep.equal([{ spec: { id: '123' }, tests: [{ specId: '123', id: 'random1' }] }])
    })

    it('throws an error when a test does not map to a spec', () => {
      const specs = createSpecs(['123'])
      const tests = [
        { specId: '123', id: 'random1' },
        { specId: '456', id: 'random2' },
      ]

      const specsListWrapper = () => {
        return specsList(specs, tests)
      }

      expect(specsListWrapper).to.throw('Could not find spec for id 456')
    })
  })
})
