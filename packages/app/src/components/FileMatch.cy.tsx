import FileMatch from './FileMatch.vue'
import { ref } from 'vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { each } from 'lodash'

/*----------  Selectors  ----------*/
// Inputs
const anyFilenameInputSelector = `[placeholder="${defaultMessages.components.fileSearch.byFilenameInput}"]`
const filenameInputSelector = `${anyFilenameInputSelector}:first`
const extensionInputSelector = `[placeholder="${defaultMessages.components.fileSearch.byExtensionInput}"]`
const fileMatchButtonSelector = '[data-cy=file-match-button]'

// File Match Indicator
// X out of Y Matches when searching the file list
const fileMatchIndicatorSelector = '[data-cy=file-match-indicator]'

const initialExtension = '*.stories.*'
const initialPattern = ''

describe('<FileMatch />', { viewportWidth: 600, viewportHeight: 300 }, () => {
  describe('with some matches', () => {
    beforeEach(() => {
      const extensionPattern = ref(initialExtension)
      const pattern = ref(initialPattern)
      const matches = { total: 10, found: 9 }

      const onUpdateExtensionPatternSpy = cy.spy().as('onUpdateExtensionPatternSpy')
      const onUpdatePatternSpy = cy.spy().as('onUpdatePatternSpy')

      const methods = {
        'onUpdate:extensionPattern': (newValue) => {
          extensionPattern.value = newValue
          onUpdateExtensionPatternSpy(newValue)
        },
        'onUpdate:pattern': (newValue) => {
          pattern.value = newValue
          onUpdatePatternSpy(newValue)
        },
      }

      cy.mount(() => (<div class="p-12 resize overflow-auto">
        <FileMatch
          matches={matches}
          extensionPattern={extensionPattern.value}
          pattern={pattern.value}
          {...methods} />
      </div>))
    })

    describe('expanding/collapsing', () => {
      it('can be expanded and collapsed by the extension button', () => {
        cy.get(extensionInputSelector).should('not.exist')
        cy.percySnapshot('before expand')
        cy.get(fileMatchButtonSelector).click()
        .get(extensionInputSelector).should('be.visible')

        cy.percySnapshot('after expand')
        cy.get(fileMatchButtonSelector).click()
        .get(extensionInputSelector).should('not.exist')
      })

      it('shows the extension textfield when expanded', () => {
        cy.get(extensionInputSelector).should('not.exist')
        .get(fileMatchButtonSelector).click()
        .get(extensionInputSelector)
        .should('be.visible').and('have.value', initialExtension)
      })

      it('shows the file name textfield when collapsed', () => {
        cy.get(filenameInputSelector).should('be.visible')
      })

      it('shows the file name textfield when expanded', () => {
        cy.get(fileMatchButtonSelector).click()
        .get(filenameInputSelector).should('be.visible')
      })

      it('persists the file name search between collapsing and expanding', () => {
        const newText = 'New filename'

        cy.get(filenameInputSelector).should('be.visible')
        .clear()
        .type(newText)
        .get(fileMatchButtonSelector).click()
        .get(anyFilenameInputSelector).should('have.length', 1)
        .get(filenameInputSelector).should('have.value', newText)
        .get(fileMatchButtonSelector).click()
        .get(filenameInputSelector).should('have.value', newText)
      })

      it('persists the extension search between collapsing and expanding', () => {
        const newText = 'New extension'

        cy.get(extensionInputSelector).should('not.exist')
        .get(fileMatchButtonSelector).click()
        .get(extensionInputSelector).should('be.visible')
        .clear()
        .type(newText)
        .get(fileMatchButtonSelector).click().click()
        .get(extensionInputSelector).should('be.visible').and('have.value', newText)
      })

      it('displays the extension in the extension button when collapsed', () => {
        const newText = 'New extension'

        cy.get(extensionInputSelector).should('not.exist')
        .get(fileMatchButtonSelector).click()
        .get(extensionInputSelector).should('be.visible')
        .clear()
        .type(newText)
        .get(fileMatchButtonSelector).click()
        .should('contain.text', newText)
      })

      it('does not display in the extension button when expanded', () => {
        cy.get(extensionInputSelector).should('not.exist')
        .get(fileMatchButtonSelector).click()
        .should('have.text', '')
        .click()
        .should('have.text', initialExtension)
      })
    })

    describe('extensionPattern', () => {
      it('emits the update:extensionPattern event', () => {
        const newExtension = '*.tsx'

        cy.get(fileMatchButtonSelector).click()
        .get(extensionInputSelector)
        .clear()
        .type(newExtension)
        .get('@onUpdateExtensionPatternSpy')
        .should('have.been.calledWith', newExtension)
      })

      it('displays the initial extension pattern', () => {
        cy.get(fileMatchButtonSelector).should('have.text', initialExtension)
        .click()
        .get(extensionInputSelector).should('have.value', initialExtension)
      })
    })

    describe('pattern', () => {
      it('emits the update:pattern event', () => {
        const newFilePattern = 'BaseComponent'

        cy.get(filenameInputSelector).type(newFilePattern)
        .get('@onUpdatePatternSpy')
        .should('have.been.calledWith', newFilePattern)
      })
    })
  })

  describe('indicator', () => {
    /*----------  Fixtures  ----------*/
    // Matches
    const total = 10
    const matchesData: Record<string, [{ matches: {found: number, total: number}, pattern?: string, extensionPattern?: string }, string]> = {
      all: [
        { matches: { found: 10, total } },
        '10 matches',
      ],
      'ignores numerator when file pattern isn\'t searched': [
        { matches: { found: 9, total } },
        '10 matches',
      ],
      'shows numerator when file pattern is searched': [
        { matches: { found: 9, total }, pattern: 'A Pattern', extensionPattern: '*.tsx' },
        '9 of 10 matches',
      ],
      one: [
        { matches: { found: 1, total }, pattern: 'A Pattern', extensionPattern: '*.tsx' },
        '1 of 10 matches',
      ],
      'one without a pattern': [
        { matches: { found: 1, total } },
        '1 match',
      ],
      'no matches': [
        { matches: { found: 0, total: 0 } },
        'No matches',
      ],
    }

    each(matchesData, ([theProps, expected], key) => {
      it(`displays ${key} matches`, () => {
        cy.mount(() => <FileMatch matches={theProps.matches} pattern={theProps.pattern || ''} extensionPattern={theProps.extensionPattern || ''} />)
        .get(fileMatchIndicatorSelector)
        .should('have.text', expected)
      })
    })
  })
})
