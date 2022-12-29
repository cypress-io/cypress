import { DebugSpecListGroupsFragment, DebugSpecListSpecFragment, DebugSpecListTestsFragment, DebugSpecsFragmentDoc } from '../generated/graphql-test'
import DebugContainer from './DebugContainer.vue'
import { defaultMessages } from '@cy/i18n'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { specsList } from './utils/DebugMapping'
import { CloudRunStubs } from '@packages/graphql/test/stubCloudTypes'

describe('<DebugContainer />', () => {
  describe('empty states', () => {
    const validateEmptyState = (expectedMessages: string[]) => {
      cy.mountFragment(DebugSpecsFragmentDoc, {
        render: (gqlVal) => {
          return (
            <DebugContainer
              gql={gqlVal}
            />
          )
        },
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

  describe('run states', { viewportWidth: 900 }, () => {
    beforeEach(() => {
      const loginConnectStore = useLoginConnectStore()

      loginConnectStore.setUserFlag('isLoggedIn', true)
      loginConnectStore.setProjectFlag('isProjectConnected', true)
    })

    function mountTestRun (runName: string) {
      cy.mountFragment(DebugSpecsFragmentDoc, {
        onResult: (result) => {
          if (result.currentProject?.cloudProject?.__typename === 'CloudProject') {
            const test = result.currentProject.cloudProject.runByNumber
            const other = CloudRunStubs[runName] as typeof test

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
    }

    context('passed', () => {
      it('renders', () => {
        mountTestRun('allPassing')

        cy.contains('Well Done!').should('be.visible')

        cy.percySnapshot()
      })
    })

    context('errored', () => {
      it('renders', () => {
        mountTestRun('allSkipped')

        cy.contains('The browser server never connected.').should('be.visible')
        cy.contains('2 of 3 specs skipped').should('be.visible')

        cy.percySnapshot()
      })
    })

    context('no tests', () => {
      it('renders', () => {
        mountTestRun('noTests')

        cy.contains('Run has no tests').should('be.visible')

        cy.percySnapshot()
      })
    })

    context('timed out', () => {
      it('renders with CI information', () => {
        mountTestRun('timedOutWithCi')

        cy.contains('Circle CI #1234').should('have.attr', 'href', 'https://circleci.com').should('be.visible')
        cy.contains('Archive this run to remove it').should('be.visible')

        cy.percySnapshot()
      })

      it('renders without CI information', () => {
        mountTestRun('timedOutWithoutCi')

        cy.contains('Circle CI #1234').should('not.exist')
        cy.contains('Archive this run to remove it').should('be.visible')

        cy.percySnapshot()
      })
    })

    context('over limit', () => {
      it('renders', () => {
        mountTestRun('overLimit')

        cy.findByRole('link', { name: 'Contact admin' }).should('have.attr', 'href', 'http://localhost:3000?utmMedium=Debug+Tab&utmSource=Binary%3A+Launchpad')

        cy.percySnapshot()
      })
    })

    context('cancelled', () => {
      it('renders', () => {
        mountTestRun('cancelled')

        cy.findByTestId('cancelled-by-user-avatar').should('be.visible')
        cy.contains('2 of 3 specs skipped').should('be.visible')
        cy.contains('Test Tester').should('be.visible')

        cy.percySnapshot()
      })
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
        { specId: 'a1c', id: 'random1', thumbprint: 'unique1' },
        { specId: 'a1c', id: 'random2', thumbprint: 'unique2' },
      ] as DebugSpecListTestsFragment[]
      const groups = [
        { id: 'a', testingType: 'e2e' },
        { id: 'b', testingType: 'e2e' },
      ] as DebugSpecListGroupsFragment[]

      const debugMappingArray = specsList({ specs, tests, groups, localSpecs: [], currentTestingType: 'e2e' })

      expect(debugMappingArray).to.have.length(1)
      expect(debugMappingArray).to.have.eql([
        {
          spec: { id: 'a1c', groupIds: ['a'] },
          tests: { 'unique1': [{ specId: 'a1c', id: 'random1', thumbprint: 'unique1' }], 'unique2': [{ specId: 'a1c', id: 'random2', thumbprint: 'unique2' }] },
          groups: { 'a': { id: 'a', testingType: 'e2e' } },
          foundLocally: false,
          testingType: 'e2e',
          matchesCurrentTestingType: true,
        },
      ])
    })

    it('maps correctly for multiple specs and test', () => {
      const specs = [
        { id: '123', groupIds: ['a'] },
        { id: '456', groupIds: ['b'] },
        { id: '789', groupIds: ['a', 'b'] },
      ] as DebugSpecListSpecFragment[]
      const tests = [
        { specId: '123', id: 'random1', thumbprint: 'unique1' },
        { specId: '456', id: 'random2', thumbprint: 'unique2' },
        { specId: '456', id: 'random3', thumbprint: 'unique3' },
        { specId: '789', id: 'random4', thumbprint: 'unique4' },
        { specId: '123', id: 'random6', thumbprint: 'unique5' },
        { specId: '789', id: 'random7', thumbprint: 'unique4' },
      ] as DebugSpecListTestsFragment[]
      const groups = [
        { id: 'a', testingType: 'e2e' },
        { id: 'b', testingType: 'e2e' },
      ] as DebugSpecListGroupsFragment[]

      const debugMappingArray = specsList({ specs, tests, localSpecs: [], currentTestingType: 'e2e', groups })
      const expectedSpec123 = {
        spec: { id: '123', groupIds: ['a'] },
        tests: { 'unique1': [{ specId: '123', id: 'random1', thumbprint: 'unique1' }], 'unique5': [{ specId: '123', id: 'random6', thumbprint: 'unique5' }] },
        groups: { 'a': { id: 'a', testingType: 'e2e' } },
        foundLocally: false,
        testingType: 'e2e',
        matchesCurrentTestingType: true,
      }

      const expectedSpec456 = {
        spec: { id: '456', groupIds: ['b'] },
        tests: { 'unique2': [{ specId: '456', id: 'random2', thumbprint: 'unique2' }], 'unique3': [{ specId: '456', id: 'random3', thumbprint: 'unique3' }] },
        groups: { 'b': { id: 'b', testingType: 'e2e' } },
        foundLocally: false,
        testingType: 'e2e',
        matchesCurrentTestingType: true,
      }

      const expectedSpec789 = {
        spec: { id: '789', groupIds: ['a', 'b'] },
        tests: { 'unique4': [{ specId: '789', id: 'random4', thumbprint: 'unique4' }, { specId: '789', id: 'random7', thumbprint: 'unique4' }] },
        groups: { 'a': { id: 'a', testingType: 'e2e' }, 'b': { id: 'b', testingType: 'e2e' } },
        foundLocally: false,
        testingType: 'e2e',
        matchesCurrentTestingType: true,
      }

      const expected = [
        expectedSpec123, expectedSpec456, expectedSpec789,
      ]

      expect(debugMappingArray).to.deep.equal(expected)
    })

    it('maps does not show specs that do not have tests', () => {
      const specs = [
        { id: '123', groupIds: ['a'] },
        { id: '456', groupIds: ['a'] },
        { id: '789', groupIds: ['a'] },
      ] as DebugSpecListSpecFragment[]
      const tests = [{ specId: '123', id: 'random1', thumbprint: 'unique1' }] as DebugSpecListTestsFragment[]
      const groups = [{ id: 'a', testingType: 'e2e' }] as DebugSpecListGroupsFragment[]

      const debugMappingArray = specsList({ specs, tests, localSpecs: [], currentTestingType: 'e2e', groups })

      expect(debugMappingArray).to.deep.equal(
        [
          {
            spec: { id: '123', groupIds: ['a'] },
            tests: { 'unique1': [{ specId: '123', id: 'random1', thumbprint: 'unique1' }] },
            groups: { 'a': { id: 'a', testingType: 'e2e' } },
            foundLocally: false,
            testingType: 'e2e',
            matchesCurrentTestingType: true,
          },
        ],
      )
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
