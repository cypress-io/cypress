import ExpandableFileChooser from './ExpandableFileChooser.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import data from '../../../cypress/fixtures/FileChooser.json'
import type { FileParts } from '@packages/data-context/src/gen/graphcache-config.gen'

/*----------  Fixtures  ----------*/
const numFiles = data.length
const allFiles = data as unknown as FileParts[]
const extensionPattern = '*.jsx'
const existentExtensionPattern = '*.tsx'
const nonExistentFileName = 'non existent file'

/*----------  Selectors  ----------*/
// File List
const fileRowSelector = '[data-cy=file-list-row]'

// Inputs
const filenameInputSelector = `[placeholder="${defaultMessages.components.fileSearch.byFilenameInput}"]:first`
const extensionInputSelector = `[placeholder="${defaultMessages.components.fileSearch.byExtensionInput}"]`
const fileMatchButtonSelector = '[data-cy=file-match-button]'

// File Match Indicator
// X out of Y Matches when searching the file list
const fileMatchIndicatorSelector = '[data-cy=file-match-indicator]'

// No Results
const noResultsSelector = '[data-testid=no-results]'
const noResultsClearButtonSelector = '[data-cy=no-results-clear]'

describe('<ExpandableFileChooser />', () => {
  it('renders files in a list', () => {
    cy.mount(() => (<ExpandableFileChooser extensionPattern={extensionPattern} files={allFiles} />))
    .get(fileRowSelector)
    .should('have.length', numFiles)

    cy.percySnapshot()
  })

  it('can search by file name', () => {
    cy.mount(() => (<ExpandableFileChooser extensionPattern={extensionPattern} files={allFiles} />))
    .get(filenameInputSelector)
    .type('random string', { delay: 0 })
  })

  it('filters the files by file name', () => {
    const query = 'base'
    const expectedMatches = allFiles.filter((f) => f.relative.toLowerCase().includes(query)).length

    cy.mount(() => (<ExpandableFileChooser extensionPattern={extensionPattern} files={allFiles} />))
    .get(filenameInputSelector).type(query, { delay: 0 })
    .get(fileRowSelector)
    .should('have.length.at.least', expectedMatches)
    .and('have.length.below', allFiles.length)
  })

  describe('matches', () => {
    it('displays the total number of file matches', () => {
      cy.mount(() => (<ExpandableFileChooser extensionPattern={extensionPattern} files={allFiles} />))
      .get(fileMatchIndicatorSelector).should('contain.text', `${allFiles.length } matches`)
    })

    it('handles pluralization', () => {
      cy.mount(() => (<ExpandableFileChooser extensionPattern={extensionPattern} files={[allFiles[0]]} />))
      .get(fileMatchIndicatorSelector).should('contain.text', `${1 } match`)
    })

    it('handles no matches', () => {
      cy.mount(() => (<ExpandableFileChooser extensionPattern={extensionPattern} files={[]} />))
      .get(fileMatchIndicatorSelector).should('contain.text', 'No matches')
    })

    it('updates the number of files found out of the total number available', () => {
      const query = 'base'

      cy.mount(() => (<ExpandableFileChooser extensionPattern={extensionPattern} files={allFiles} />))
      .get(filenameInputSelector)

      // Type some stuff in that will at least partially match components
      .type(query, { delay: 0 })
      .get(fileRowSelector)
      .then(($rows) => {
        // Figure out how many files were actually matched and make sure
        // that they're out of the total files passed in
        cy.get(fileMatchIndicatorSelector)
        .should('contain.text', `${$rows.length} of ${allFiles.length} matches`)

        // Get back to an empty state where all files are shown
        .get(filenameInputSelector).clear()
        .get(fileMatchIndicatorSelector).should('contain.text', `${allFiles.length } matches`)

        // Go to the no matches state
        .get(filenameInputSelector).type(nonExistentFileName, { delay: 0 })
        .get(fileMatchIndicatorSelector).should('contain.text', 'No matches')
      })
    })
  })

  describe('no results', () => {
    it('does not show no results when there are files', () => {
      cy.mount(() => (<ExpandableFileChooser extensionPattern={extensionPattern} files={allFiles} />))
      .get(noResultsSelector).should('not.exist')
    })

    it('shows no results when there are no files', () => {
      cy.mount(() => (<ExpandableFileChooser extensionPattern={extensionPattern} files={[]} />))
      .get(noResultsSelector).should('be.visible')
    })

    describe('when searching the file pattern', () => {
      it('handles "no results" with the right text', () => {
        cy.mount(() => (<ExpandableFileChooser extensionPattern={extensionPattern} files={allFiles} />))
        .get(filenameInputSelector)
        .type(nonExistentFileName, { delay: 0 })
        .get(noResultsSelector)
        .should('contain.text', defaultMessages.noResults.defaultMessage)
        .and('contain.text', nonExistentFileName)
      })

      it('clears the file search but leaves the extension search alone', () => {
        cy.mount(() => (<ExpandableFileChooser extensionPattern={extensionPattern} files={allFiles} />))
        .get(fileMatchButtonSelector)
        .should('have.text', extensionPattern)
        .click()

        // Add some text to the extension to make it different than the
        // initial one
        .get(extensionInputSelector).clear().type(existentExtensionPattern, { delay: 0 })

        // Add some text to the file name search to make it different than the
        // initial one
        .get(filenameInputSelector).type(nonExistentFileName, { delay: 0 })

        // Clear
        .get(noResultsClearButtonSelector).click()

        // Extension pattern is still the same
        .get(extensionInputSelector).should('have.value', existentExtensionPattern)

        // And the file name input has been is cleared
        .get(filenameInputSelector).should('have.value', '')
      })
    })

    describe('when searching the extension', () => {
      it('handles "no results" with the right text', () => {
        cy.mount(() => (<ExpandableFileChooser extensionPattern={extensionPattern} files={[]} />))
        .get(noResultsSelector)
        .findByText(defaultMessages.components.fileSearch.noMatchesForExtension)
        .should('be.visible')
      })

      it('renders the extension inside of the no results view', () => {
        cy.mount(() => (<ExpandableFileChooser
          extensionPattern={extensionPattern}
          files={[]} />))
        .get(noResultsSelector)
        .findByText(extensionPattern).should('be.visible')

        cy.percySnapshot()
      })

      it('resets the extension to the initial extension', () => {
        cy.mount(() => (<ExpandableFileChooser
          extensionPattern={extensionPattern}
          files={[]} />))
        .get(fileMatchButtonSelector)
        .should('have.text', extensionPattern)
        .click()

        .get(extensionInputSelector).clear().type(existentExtensionPattern, { delay: 0 })
        .get(noResultsClearButtonSelector).click()
        .get(extensionInputSelector).should('have.value', extensionPattern)
      })
    })
  })

  it('debounces the file extension input event', () => {
    const onUpdateExtensionSpy = cy.spy().as('onUpdateExtensionSpy')
    const spies = {
      'onUpdate:extensionPattern': onUpdateExtensionSpy,
    }

    const newExtension = existentExtensionPattern

    cy.mount(() => (
      <ExpandableFileChooser
        {...spies}
        extensionPattern={extensionPattern}
        files={allFiles}></ExpandableFileChooser>))
    // Make sure the extension is in the button
    .get(fileMatchButtonSelector)
    .should('have.text', extensionPattern)
    .click()

    // Clear the extension
    .get(extensionInputSelector)
    .clear()

    // Make sure we emit the update event with "clear"
    .get('@onUpdateExtensionSpy').should('have.been.calledOnceWith', '')

    // Type a new extension in
    .get(extensionInputSelector)
    .type(newExtension, { delay: 0 })

    // Validate it's in there
    .get(extensionInputSelector)
    .should('have.value', newExtension)

    // debounce should cause this to hit
    .get('@onUpdateExtensionSpy').should('not.have.been.calledWith', newExtension)

    // once the debounce is resolved, this will hit
    .get('@onUpdateExtensionSpy').should('have.been.calledWith', newExtension)
  })

  it('renders expanded content slot when row is clicked', () => {
    cy.contains('This is the expanded content').should('not.exist')

    cy.mount(() => (
      <ExpandableFileChooser
        v-slots={{ item: <div>This is the expanded content</div> }}
        extensionPattern={extensionPattern}
        files={allFiles}>
      </ExpandableFileChooser>
    ))

    cy.findAllByTestId('file-list-row').first().click()

    cy.contains('This is the expanded content').should('be.visible')
  })
})
