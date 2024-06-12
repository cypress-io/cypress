import { RunsConnectSuccessAlertFragmentDoc } from '../generated/graphql-test'
import RunsConnectSuccessAlert from './RunsConnectSuccessAlert.vue'

describe('<RunConnectSuccessAlert />', { viewportHeight: 400 }, () => {
  it('playground', () => {
    cy.mountFragment(RunsConnectSuccessAlertFragmentDoc, {
      render: (gqlVal) => {
        return (
          <div class="bg-gray-100 h-screen p-3">
            <RunsConnectSuccessAlert gql={gqlVal} />
          </div>
        )
      },
    })
  })

  // https://github.com/cypress-io/cypress/issues/21856
  describe('responsive design', () => {
    it('small screen (width < md(768px))', () => {
      cy.mountFragment(RunsConnectSuccessAlertFragmentDoc, {
        render: (gqlVal) => {
          return (
            <div class="bg-gray-100 h-screen p-3">
              <RunsConnectSuccessAlert gql={gqlVal} />
            </div>
          )
        },
      })

      cy.viewport(400, 800)
      cy.percySnapshot()
    })

    it('wide screen (width >= md(768px))', () => {
      cy.mountFragment(RunsConnectSuccessAlertFragmentDoc, {
        render: (gqlVal) => {
          return (
            <div class="bg-gray-100 h-screen p-3">
              <RunsConnectSuccessAlert gql={gqlVal} />
            </div>
          )
        },
      })
    })
  })
})
