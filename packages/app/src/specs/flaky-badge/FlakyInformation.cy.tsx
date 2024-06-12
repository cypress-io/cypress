import type { FlakyInformationCloudSpecFragment, FlakyInformationProjectFragment, FlakyInformationSpecFragment } from '../../generated/graphql'
import FlakyInformation from './FlakyInformation.vue'

describe('<FlakyInformation />', () => {
  function mountWithFlakyStatus (flaky: boolean) {
    const project: FlakyInformationProjectFragment = {
      __typename: 'CurrentProject',
      id: '1',
      branch: 'develop',
      projectId: 'abc123',
    }
    const spec: FlakyInformationSpecFragment = {
      __typename: 'Spec',
      id: '2',
      fileName: 'abc',
      specFileExtension: 'cy.tsx',
      relative: 'test/abc.cy.tsx',
    }
    const cloudSpec: FlakyInformationCloudSpecFragment = {
      __typename: 'RemoteFetchableCloudProjectSpecResult',
      id: '3',
      data: {
        __typename: 'CloudProjectSpec',
        id: '3',
        isConsideredFlakyForRunIds: flaky,
        flakyStatusForRunIds: {
          __typename: 'CloudProjectSpecFlakyStatus',
          dashboardUrl: '#',
          flakyRuns: 1,
          flakyRunsWindow: 5,
          lastFlaky: 3,
          severity: 'LOW',
        },
      },
    }

    cy.mount(<FlakyInformation projectGql={project} specGql={spec} cloudSpecGql={cloudSpec} />)
  }

  it('renders if flaky status returned as true', () => {
    mountWithFlakyStatus(true)

    cy.findByTestId('flaky-badge').should('be.visible')

    cy.get('.v-popper').should('be.visible')
  })

  it('does not render if flaky status returned as false', () => {
    mountWithFlakyStatus(false)

    cy.findByTestId('flaky-badge').should('not.exist')
  })
})
