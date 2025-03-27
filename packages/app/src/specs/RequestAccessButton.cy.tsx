// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { RequestAccessButton_RequestAccessDocument } from '../generated/graphql'
import { RequestAccessButtonFragmentDoc } from '../generated/graphql-test'
import RequestAccessButton from './RequestAccessButton.vue'

const requestAccessButtonSelector = '[data-cy=request-access-button]'
const requestSentButton = '[data-cy=access-requested-button]'

const messages = defaultMessages.specPage

describe('<RequestAccessButton />', () => {
  describe('unauthorized', () => {
    beforeEach(() => {
      cy.mountFragment(RequestAccessButtonFragmentDoc, {
        onResult: (result) => {
          result.currentProject = {
            __typename: 'CurrentProject',
            id: 'abc123',
            projectId: 'abc123',
            cloudProject: {
              __typename: 'CloudProjectUnauthorized',
              message: 'test',
              hasRequestedAccess: false,
            },
          }
        },
        render: (gql) => <RequestAccessButton gql={gql} />,
      })
    })

    it('renders request access content', () => {
      cy.get(requestAccessButtonSelector)
      .should('be.visible')
      .and('contain.text', messages.requestAccessButton)
    })

    it('triggers mutation on button click', () => {
      const requestAccessMutationTracker = cy.stub()

      cy.remoteGraphQLIntercept
      cy.stubMutationResolver(RequestAccessButton_RequestAccessDocument, (defineResult) => {
        requestAccessMutationTracker()

        return defineResult({
          cloudProjectRequestAccess: {
            __typename: 'CloudProjectUnauthorized',
            message: 'test',
            hasRequestedAccess: true,
          },
        })
      })

      cy.get(requestAccessButtonSelector)
      .click()
      .then(() => {
        expect(requestAccessMutationTracker).to.have.been.called
      })
    })
  })

  describe('access requested', () => {
    beforeEach(() => {
      cy.mountFragment(RequestAccessButtonFragmentDoc, {
        onResult: (result) => {
          result.currentProject = {
            __typename: 'CurrentProject',
            id: 'abc123',
            projectId: 'abc123',
            cloudProject: {
              __typename: 'CloudProjectUnauthorized',
              message: 'test',
              hasRequestedAccess: true,
            },
          }
        },
        render: (gql) => <RequestAccessButton gql={gql} />,
      })
    })

    it('renders access requested content', () => {
      cy.get(requestSentButton)
      .should('be.visible')
      .and('contain.text', messages.requestSentButton)
    })
  })
})
