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
    const mappingList = (specs: {id: string}[], tests: {specId: string, id: string}[]) => {
      return specsList(specs, tests)
    }

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

      const debugMappingArray = mappingList(spec, tests)

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

      const debugMappingArray = mappingList(specs, tests)

      expect(debugMappingArray).to.have.length(3)
      debugMappingArray.forEach((mapping) => {
        if (mapping.spec.id === '123') {
          expect(mapping.tests).to.deep.equal([{ specId: '123', id: 'random1' }, { specId: '123', id: 'random6' }])
        } else if (mapping.spec.id === '456') {
          expect(mapping.tests).to.deep.equal([{ specId: '456', id: 'random2' }, { specId: '456', id: 'random3' }])
        } else if (mapping.spec.id === '789') {
          expect(mapping.tests).to.deep.equal([{ specId: '789', id: 'random4' }])
        }
      })
    })

    it('maps does not show specs that dont have tests', () => {
      const specs = createSpecs(['123', '456', '789'])
      const tests = [{ specId: '123', id: 'random1' }]

      const debugMappingArray = mappingList(specs, tests)

      expect(debugMappingArray).to.have.length(1)
      expect(debugMappingArray).to.deep.equal([{ spec: { id: '123' }, tests: [{ specId: '123', id: 'random1' }] }])
    })

    it('throws an error when a test does not map to a spec', () => {
      const specs = createSpecs(['123'])
      const tests = [
        { specId: '123', id: 'random1' },
        { specId: '456', id: 'random2' },
      ]

      let debugMappingArray = function () {
        mappingList(specs, tests)
      }

      expect(debugMappingArray).to.throw('Could not find spec for id 456')
    })
  })
})
