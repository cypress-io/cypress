import CreateSpecModal from './CreateSpecModal.vue'
import { ref } from 'vue'

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
  it('shows correct default filename for e2e testing', () => {
    const show = ref(true)

    cy.mount(() => (<div>
      <CreateSpecModal
        gql={{
          currentProject: {
            id: 'id',
            currentTestingType: 'e2e',
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
            defaultSpecFileName: null,
          },
        }}
        show={show.value}
        onClose={() => show.value = false}
      />
    </div>))

    cy.findByText('Create new empty spec').click()
    cy.get('input').invoke('val').should('contain', 'spec.cy.js')
  })

  it('shows correct default filename for component testing', () => {
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
            defaultSpecFileName: null,
          },
        }}
        show={show.value}
        onClose={() => show.value = false}
      />
    </div>))

    cy.get('input').invoke('val').should('contain', 'ComponentName.spec.js')
  })
})
