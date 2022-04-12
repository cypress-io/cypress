import {
  OpenFileInIde_MutationDocument,
  ScaffoldedFilesFragmentDoc,
} from '../generated/graphql-test'
import ScaffoldedFiles from './ScaffoldedFiles.vue'

describe('<ScaffoldedFiles />', () => {
  beforeEach(() => {
    cy.mountFragment(ScaffoldedFilesFragmentDoc, {
      onResult (res, ctx) {
        ctx.localSettings.preferences.preferredEditorBinary = 'code'
        res.scaffoldedFiles = [
          {
            __typename: 'ScaffoldedFile',
            status: 'changes',
            description: 'lorem ipsum dolor sit amet',
            file: {
              __typename: 'FileParts',
              id: '1',
              absolute: '/absolute/file/path.js',
              relative: 'file/path.js',
              contents: `module.exports = {}`,
              fileExtension: 'js',
            },
          },
        ]
      },
      render: (gql) => {
        return (
          <div>
            <ScaffoldedFiles gql={gql} />
          </div>
        )
      },
    })
  })

  it('playground', () => {
    cy.stubMutationResolver(OpenFileInIde_MutationDocument, cy.stub().as('OpenFileInIde'))
    cy.contains('button', 'Continue').should('exist')
    cy.contains('a', 'file/path.js').click()
    cy.get('@OpenFileInIde').should('be.calledWith',
      Cypress.sinon.match.any,
      Cypress.sinon.match({ input: { filePath: '/absolute/file/path.js' } }))
  })

  it('should open the file in the preferred editor', () => {
    cy.stubMutationResolver(OpenFileInIde_MutationDocument, cy.stub().as('OpenFileInIde'))
    cy.contains('button', 'Continue').should('exist')
    cy.contains('a', 'file/path.js').click()
    cy.get('@OpenFileInIde').should('be.calledWith',
      Cypress.sinon.match.any,
      Cypress.sinon.match({ input: { filePath: '/absolute/file/path.js' } }))
  })
})
