import FileChooser from './FileChooser.vue'

import { randomComponents } from '@packages/frontend-shared/cypress/support/mock-graphql/testStubSpecs'
import { ref } from 'vue'
import { defaultMessages } from '@cy/i18n'
import { fileExtension } from '../../../cypress/support/fixtures';

const numFiles = 120
const allFiles = randomComponents(numFiles)
const fileRowSelector = '[data-testid=file-list-row]'
const filenameInputSelector = `[placeholder="${defaultMessages.components.fileSearch.byFilenameInput}"]`
const extensionInputSelector = `[placeholder="${defaultMessages.components.fileSearch.byExtensionInput}"]`
const loadingSelector = '[data-testid=loading]'
const fileMatchButtonSelector = '[data-testid=file-match-button]'

const noResultsSelector = '[data-testid=no-results]'

const extensionPattern = '*.jsx'
const existentExtensionPattern = '*.tsx'
const noResultsClearButtonSelector = '[data-testid=no-results-clear]'
const nonExistentFileName = 'non existent file'
const fileMatchIndicatorSelector = '[data-testid=file-match-indicator]'

describe('<FileChooser />', () => {
  it('renders files in a list', () => {
    cy.mount(() => (<FileChooser extensionPattern={extensionPattern} files={ allFiles } />))
    cy.get(fileRowSelector)
      .should('have.length', numFiles)
  })

  it('can search by file name', () => {
    cy.mount(() => (<FileChooser extensionPattern={extensionPattern} files={ allFiles } />))
      .get(filenameInputSelector)
      .first()
      .type("random string")
  })

  it('filters the files by file name', () => {
    const query = 'base'
    const expectedMatches = allFiles.filter(f => f.relative.toLowerCase().includes(query)).length
    cy.mount(() => (<FileChooser extensionPattern={extensionPattern} files={ allFiles } />))
      .get(filenameInputSelector).first()
      .type(query)
      .get(fileRowSelector)
      .should('have.length.at.least', expectedMatches)
      .and('have.length.below', allFiles.length)
  })

  describe('matches', () => {
    it('displays the total number of file matches', () => {
      cy.mount(() => (<FileChooser extensionPattern={extensionPattern} files={ allFiles } />))
        .get(fileMatchIndicatorSelector)
        .should('contain.text', allFiles.length + ' Matches')
    })
    
    it('handles pluralization', () => {
      cy.mount(() => (<FileChooser extensionPattern={extensionPattern} files={ [allFiles[0]] } />))
        .get(fileMatchIndicatorSelector)
        .should('contain.text', 1 + ' Match')
    })

    it('handles no matches', () => {
      cy.mount(() => (<FileChooser extensionPattern={extensionPattern} files={ [] } />))
        .get(fileMatchIndicatorSelector)
        .should('contain.text', 'No Matches')
    })

    it('updates the number of files found out of the total number available', () => {
      const query = 'base'

      cy.mount(() => (<FileChooser extensionPattern={extensionPattern} files={ allFiles } />))
        .get(filenameInputSelector).first()

        // Type some stuff in that will at least partially match components
        .type(query)
        .get(fileRowSelector)
        .then(($rows) => {

          // Figure out how many files were actually matched and make sure
          // that they're out of the total files passed in
          cy.get(fileMatchIndicatorSelector)
            .should('contain.text', `${$rows.length} of ${allFiles.length} Matches`)

            // Get back to an empty state where all files are shown
            .get(filenameInputSelector).first().clear()
            .get(fileMatchIndicatorSelector).should('contain.text', allFiles.length + ' Matches')
            
            // Go to the no matches state
            .get(filenameInputSelector).first().type(nonExistentFileName)
            .get(fileMatchIndicatorSelector).should('contain.text', 'No Matches')
        })
    })
  })

  describe('no results', () => {
    it('does not show no results when there are files', () => {
      cy.mount(() => (<FileChooser extensionPattern={extensionPattern} files={ allFiles } />))
      .get(noResultsSelector).should('not.exist')
    })

    it('shows no results when there are no files', () => {
      cy.mount(() => (<FileChooser extensionPattern={extensionPattern} files={ [] } />))
      .get(noResultsSelector).should('be.visible')
    })

    describe('when searching the file pattern', () => {
      it('handles "no results" with the right text', () => {
        cy.mount(() => (<FileChooser extensionPattern={extensionPattern} files={ allFiles } />))
          .get(filenameInputSelector).first()
          .type(nonExistentFileName)
          .get(noResultsSelector)
          .should('contain.text', defaultMessages.noResults.defaultMessage)
          .and('contain.text', nonExistentFileName)
      })

      it('clears the file search but leaves the extension search alone', () => {
        cy.mount(() => (<FileChooser extensionPattern={extensionPattern} files={ allFiles } />))
          .get(fileMatchButtonSelector)
          .should('have.text', extensionPattern)
          .click()
          .get(extensionInputSelector)
          .clear()
          .type(existentExtensionPattern)
          .get(filenameInputSelector).first()
          .type(nonExistentFileName)
          .get(noResultsClearButtonSelector)
          .click()
          .get(extensionInputSelector)
          .should('have.value', existentExtensionPattern)
          .get(filenameInputSelector).first()
          .should('have.value', '')        
      })
    })

    describe('when searching the extension', () => {
      it('handles "no results" with the right text', () => {
        cy.mount(() => (<FileChooser extensionPattern={extensionPattern} files={ [] } />))
          .get(noResultsSelector)
          .findByText(defaultMessages.components.fileSearch.noMatchesForExtension)
          .should('be.visible')
      })

      it('renders the extension inside of the no results view', () => {
        cy.mount(() => <FileChooser
          extensionPattern={ extensionPattern }
          files={ [] } />)
          .get(noResultsSelector)
          .findByText(extensionPattern).should('be.visible')
      })

      it('resets the extension to the initial extension', () => {
        cy.mount(() => <FileChooser
          extensionPattern={ extensionPattern }
          files={ [] } />)
          .get(fileMatchButtonSelector)
          .should('have.text', extensionPattern)
          .click()

          .get(extensionInputSelector)
          .clear()
          .type(existentExtensionPattern)

          .get(noResultsClearButtonSelector)
          .click()

          .get(extensionInputSelector)
          .should('have.value', extensionPattern)
      })
    })
  })
  

  it('handles a loading state', () => {
    const loading = ref(true)
    const buttonSelector = '[data-testid=toggle-button]'
    cy.mount(() => (<div>
      <button data-testid="toggle-button" onClick={() => loading.value = !loading.value}>Toggle Loading</button>
      <FileChooser files={ allFiles } loading={ loading.value } extensionPattern={ extensionPattern } /></div>))
      .get(loadingSelector)
      .should('be.visible')
      .get(buttonSelector)
      .click()
      .get(loadingSelector).should('not.be.visible')
      .get(buttonSelector)
      .click()
      .get(loadingSelector).should('be.visible')
  })

  it('debounces the file extension input event', () => {
    const onUpdateExtensionSpy = cy.spy().as('onUpdateExtensionSpy')
    const spies = {
      'onUpdate:extensionPattern': onUpdateExtensionSpy,
    }

    const newExtension = existentExtensionPattern

    cy.mount(() => (
      <FileChooser
        { ...spies }
        extensionPattern={ extensionPattern }
        files={ allFiles }></FileChooser>)
    )
      .get(fileMatchButtonSelector)
      .should('have.text', extensionPattern)
      .click()

      .get(extensionInputSelector)
      .clear()

      .get('@onUpdateExtensionSpy').should('have.been.calledOnceWith', '')

      .get(extensionInputSelector)
      .type(newExtension)

      .get(extensionInputSelector)
      .should('have.value', newExtension)

      // debounce should cause this to hit
      .get('@onUpdateExtensionSpy').should('not.have.been.calledWith', newExtension)

      // once the debounce is resolved, this will hit
      .get('@onUpdateExtensionSpy').should('have.been.calledWith', newExtension)
  })

  it('fires a selectFile event when a file is clicked on', () => {
    const onSelectFileSpy = cy.spy().as('onSelectFileSpy')
    cy.mount(() => (
      <FileChooser
        onSelectFile={onSelectFileSpy}
        extensionPattern={ extensionPattern }
        files={ allFiles }></FileChooser>)
    )
  })
})