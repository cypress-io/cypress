import FileList from './FileList.vue'
import data from '../../../cypress/fixtures/FileList.json'
import { ref, Ref } from 'vue'
import type { FileListItemFragment } from '../../generated/graphql-test'

const difficultFile = {
  baseName: '[...all].vue',
  fileExtension: '.vue',
}

const noResultsSlot = () => <div data-testid="no-results">No Results</div>
const noResultsSelector = '[data-testid=no-results]'
const fileRowSelector = '[data-cy=file-list-row]'

const allFiles = data as FileListItemFragment[]

allFiles[1] = { ...allFiles[1], ...difficultFile }
describe('<FileList />', { viewportHeight: 500, viewportWidth: 400 }, () => {
  describe('with files', () => {
    const files = allFiles

    beforeEach(() => {
      const selectFileSpy = cy.spy().as('selectFileSpy')

      cy.mount(() => (<div class="m-2 min-w-[300px] resize overflow-auto">
        <FileList onSelectFile={selectFileSpy} files={files} />
      </div>))
    })

    it('renders all of the files passed in', () => {
      cy.get(fileRowSelector)
      .should('have.length', 10)
    })

    it('emits a selectFile event when clicking on a row', () => {
      cy.get(fileRowSelector)
      .first()
      .click()
      .get('@selectFileSpy')
      .should('have.been.calledWith', files[0])
    })

    it('correctly formats a difficult file', () => {
      cy.get('body').contains('[...all]')
      cy.percySnapshot()
    })
  })

  describe('without files', () => {
    it('shows the no results slot', () => {
      const files: Ref<typeof allFiles> = ref([])
      let idx = 0

      cy.mount(() => (<div>
        <button data-testid="add-file"
          onClick={() => {
            files.value.push(allFiles[idx]); idx++
          }}>
          Add File
        </button>

        <FileList
          v-slots={{ 'no-results': noResultsSlot }}
          files={files.value} />

      </div>))
      .get(noResultsSelector).should('be.visible')

      cy.percySnapshot()

      cy.get('[data-testid=add-file]')
      .click()
      .get(noResultsSelector).should('not.exist')
    })
  })
})
