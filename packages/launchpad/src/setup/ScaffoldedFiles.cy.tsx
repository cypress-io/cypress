import {
  ScaffoldedFilesFragmentDoc,
} from '../generated/graphql-test'
import ScaffoldedFiles from './ScaffoldedFiles.vue'
import componentFiles from '../../cypress/fixtures/scaffolded-files/component.json'
import { scaffoldedFileOrder } from '../utils/scaffoldedFileOrder'

describe('<ScaffoldedFiles />', () => {
  beforeEach(() => {
    cy.mountFragment(ScaffoldedFilesFragmentDoc, {
      render: (gql) => {
        return (
          <div>
            <ScaffoldedFiles gql={{ ...gql, scaffoldedFiles: componentFiles }} />
          </div>
        )
      },
    })
  })

  it(`CT: shows scaffolded files in a custom order`, () => {
    const expectedFileOrder = scaffoldedFileOrder.filter((file) => !file.includes('e2e'))

    cy.get('h2').each((header, i) => {
      expect(header.text(), `file index ${i}`).to.include(expectedFileOrder[i])
    })
  })

  it(`e2e: shows scaffolded files in a custom order`, () => {
    const expectedFileOrder = scaffoldedFileOrder.filter((file) => !file.includes('component'))

    cy.get('h2').each((header, i) => {
      expect(header.text(), `file index ${i}`).to.include(expectedFileOrder[i])
    })
  })

  it('playground', () => {
    cy.contains('button', 'Continue').should('exist')
  })
})
