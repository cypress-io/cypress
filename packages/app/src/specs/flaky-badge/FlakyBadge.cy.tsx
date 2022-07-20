import { FlakyBadgeFragmentDoc } from '../../generated/graphql-test'
import FlakyBadge from './FlakyBadge.vue'
import { defaultMessages } from '@cy/i18n'

const flakyBadgeTestId = 'flaky-badge'

describe('<FlakyBadge />', () => {
  function mountWithFlakyStatus (isFlaky: boolean) {
    cy.mountFragment(FlakyBadgeFragmentDoc, {
      variableTypes: {
        fromBranch: 'String',
      },
      variables: {
        fromBranch: 'develop',
      },
      onResult: (result) => {
        if (result.data?.__typename !== 'CloudProjectSpec') {
          throw new Error('Unexpected GQL fragment, should be CloudProjectSpec')
        }

        result.data.isConsideredFlaky = isFlaky
      },
      render: (gql) => <FlakyBadge gql={gql} dashboardUrl="#" />,
    })
  }

  it('should render if is flaky', () => {
    mountWithFlakyStatus(true)

    cy.findByTestId(flakyBadgeTestId)
    .should('have.text', defaultMessages.specPage.flaky.badgeLabel)
    .and('be.visible')

    cy.percySnapshot()
  })

  it('should not render if not flaky', () => {
    mountWithFlakyStatus(false)

    cy.findByTestId(flakyBadgeTestId)
    .should('not.exist')

    cy.percySnapshot()
  })
})
