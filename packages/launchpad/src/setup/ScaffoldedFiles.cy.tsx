import {
  ScaffoldedFilesFragmentDoc,
} from '../generated/graphql-test'
import ScaffoldedFiles from './ScaffoldedFiles.vue'
import scaffoldFixture from '../../cypress/fixtures/scaffolded-files.json'
import { scaffoldedFileOrder } from '../utils/scaffoldedFileOrder'

['component', 'e2e'].forEach((testingType) => {
  describe(`${testingType} <ScaffoldedFiles />`, () => {
    beforeEach(() => {
      cy.mountFragment(ScaffoldedFilesFragmentDoc, {
        render: (gql) => {
          return (
            <div>
              <ScaffoldedFiles gql={{
                ...gql,
                scaffoldedFiles: scaffoldFixture[testingType],
              }} />
            </div>
          )
        },
      })
    })

    it(`shows scaffolded files in a custom order`, () => {
      const typeToExclude = (testingType === 'e2e') ? 'component' : 'e2e'
      const expectedFileOrder = scaffoldedFileOrder.filter((file) => !file.includes(typeToExclude))

      cy.get('h2').each((header, i) => {
        expect(header.text(), `file index ${i}`).to.include(expectedFileOrder[i])
      })
    })

    it('playground', () => {
      cy.contains('button', 'Continue').should('exist')
    })
  })
})
