import CreateSpecModal from './CreateSpecModal.vue'
import { ref } from 'vue'
import { CreateSpecModalFragmentDoc } from '../generated/graphql-test'

const modalCloseSelector = '[aria-label=Close]'
const triggerButtonSelector = '[data-testid=trigger]'
const modalSelector = '[data-cy=create-spec-modal]'

describe('<CreateSpecModal />', () => {
  beforeEach(() => {
    const show = ref(true)

    cy.mount(() => (<div>
      <CreateSpecModal
        gql={{
          currentProject: {
            id: 'id',
            currentTestingType: 'component',
            configFile: 'cypress.config.js',
            configFileAbsolutePath: '/path/to/cypress.config.js',
            config: [{
              field: 'e2e',
              value: {
                specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
              },
            }, {
              field: 'component',
              value: {
                specPattern: '**/*.cy.{js,jsx,ts,tsx}',
              },
            }],
            specs: [],
            fileExtensionToUse: 'js',
            defaultSpecFileName: 'cypress/e2e/ComponentName.cy.js',
          },
        }}
        show={show.value}
        onClose={() => show.value = false}
      />
    </div>))
  })

  it('renders a modal', () => {
    cy.get(modalSelector).should('be.visible')

    cy.percySnapshot()
  })

  describe('dismissing', () => {
    it('is dismissed when you click outside', () => {
      cy.get(modalSelector)
      .click(0, 0)
      .get(modalSelector)
      .should('not.exist')
    })

    it('is dismissed when the X button is clicked', () => {
      cy.get(modalSelector)
      .get(modalCloseSelector)
      .click()
      .get(modalSelector)
      .should('not.exist')
    })
  })
})

describe('Modal Text Input', () => {
  it('focuses text input and selects file name by default', () => {
    const show = ref(true)

    cy.mount(() => (<div>
      <CreateSpecModal
        gql={{
          currentProject: {
            id: 'id',
            currentTestingType: 'component',
            configFile: 'cypress.config.js',
            configFileAbsolutePath: '/path/to/cypress.config.js',
            config: [{
              field: 'e2e',
              value: {
                specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
              },
            }, {
              field: 'component',
              value: {
                specPattern: '**/*.cy.{js,jsx,ts,tsx}',
              },
            }],
            specs: [],
            fileExtensionToUse: 'js',
            defaultSpecFileName: 'cypress/e2e/ComponentName.cy.js',
          },
        }}
        show={show.value}
        onClose={() => show.value = false}
      />
    </div>))

    cy.focused().as('specNameInput')

    // focused should yield the input element since it should be auto-focused
    cy.get('@specNameInput').invoke('val').should('equal', 'cypress/e2e/ComponentName.cy.js')

    // only the file name should be focused, so backspacing should erase the whole file name
    cy.get('@specNameInput').type('{backspace}')

    cy.get('@specNameInput').invoke('val').should('equal', 'cypress/e2e/.cy.js')
  })

  it('focuses text input but does not select if default file name does not match regex', () => {
    const show = ref(true)

    cy.mount(() => (<div>
      <CreateSpecModal
        gql={{
          currentProject: {
            id: 'id',
            currentTestingType: 'component',
            configFile: 'cypress.config.js',
            configFileAbsolutePath: '/path/to/cypress.config.js',
            config: [{
              field: 'e2e',
              value: {
                specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
              },
            }, {
              field: 'component',
              value: {
                specPattern: '**/*.cy.{js,jsx,ts,tsx}',
              },
            }],
            specs: [],
            fileExtensionToUse: 'js',
            defaultSpecFileName: 'this/path/does/not/produce/regex/match-',
          },
        }}
        show={show.value}
        onClose={() => show.value = false}
      />
    </div>))

    cy.focused().as('specNameInput')

    // focused should yield the input element since it should be auto-focused
    cy.get('@specNameInput').invoke('val').should('equal', 'this/path/does/not/produce/regex/match-')

    // nothing should be selected, so backspacing should only delete the last character in the file path
    cy.get('@specNameInput').type('{backspace}')

    cy.get('@specNameInput').invoke('val').should('equal', 'this/path/does/not/produce/regex/match')
  })
})

describe('playground', () => {
  it('can be opened and closed via the show prop', () => {
    const show = ref(false)

    cy.mount(() => (<>
      <button data-testid="trigger" onClick={() => show.value = true}>Open Modal</button>
      <br/>
      <CreateSpecModal
        gql={{
          currentProject: {
            id: 'id',
            currentTestingType: 'component',
            configFile: 'cypress.config.js',
            configFileAbsolutePath: '/path/to/cypress.config.js',
            config: [{
              field: 'e2e',
              value: {
                specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
              },
            }, {
              field: 'component',
              value: {
                specPattern: '**/*.cy.{js,jsx,ts,tsx}',
              },
            }],
            specs: [],
            fileExtensionToUse: 'js',
            defaultSpecFileName: 'cypress/e2e/ComponentName.cy.js',
          },
        }}
        show={show.value}
        onClose={() => show.value = false}
      />
    </>)).get(triggerButtonSelector)
    .click()
    .get(modalSelector)
    .should('be.visible')
    .get(modalCloseSelector)
  })
})

describe('defaultSpecFileName', () => {
  it('shows correct default filename for the currentProject', () => {
    const show = ref(true)

    cy.mountFragment(CreateSpecModalFragmentDoc, {
      onResult: (result) => {
        if (result.currentProject) {
          result.currentProject.defaultSpecFileName = 'path/for/spec.cy.js'
        }
      },
      render: (gql) => {
        return <CreateSpecModal gql={gql} show onClose={() => show.value = false} />
      },
    })

    cy.findByText('Create new empty spec').click()
    cy.get('input').invoke('val').should('contain', 'spec.cy.js')

    cy.percySnapshot()
  })
})
