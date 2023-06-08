import CreateSpecModal from './CreateSpecModal.vue'
import { ref } from 'vue'
import { CreateSpecModalFragmentDoc, EmptyGenerator_MatchSpecFileDocument } from '../generated/graphql-test'

const modalCloseSelector = '[aria-label=Close]'
const triggerButtonSelector = '[data-testid=trigger]'
const modalSelector = '[data-cy=create-spec-modal]'

function testEmptySpecModal (fullDefaultSpecFileName: string, specName: string) {
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

  describe('form behavior', () => {
    beforeEach(() => {
      cy.findByRole('button', { name: 'Create new spec' }).should('be.visible').click()
    })

    it('enter should call create spec function', () => {
      //submit default path
      cy.get('input')
      .type('{enter}')

      //should switch to success state
      cy.contains('h2', 'Great! The spec was successfully added')
      .should('be.visible')
    })

    it('enter should not call create spec function if spec file path is invalid', () => {
      cy.stubMutationResolver(EmptyGenerator_MatchSpecFileDocument, (defineResult, variables) => {
        //mocking one pattern use case
        return defineResult({ matchesSpecPattern: variables.specFile !== '' })
      })

      cy.get('button[type="submit"').as('submit').should('not.be.disabled')

      //try to submit an empty path which is invalid
      cy.get('input')
      .clear()
      .type('{enter}')

      //should stay on current state
      cy.contains('h2', 'Enter the path for your new spec')
      .should('be.visible')

      cy.get('@submit').should('be.disabled')
    })
  })

  describe('text Input', () => {
    beforeEach(() => {
      cy.findByRole('button', { name: 'Create new spec' }).should('be.visible').click()
    })

    it('focuses text input and selects file name by default', () => {
      cy.focused().as('specNameInput')

      // focused should yield the input element since it should be auto-focused
      cy.get('@specNameInput').invoke('val').should('equal', fullDefaultSpecFileName)

      // only the file name should be focused, so backspacing should erase the whole file name
      cy.get('@specNameInput').type('{backspace}')

      cy.get('@specNameInput').invoke('val').should('equal', fullDefaultSpecFileName.replace(specName, ''))
    })
  })
}

describe('<CreateSpecModal />', () => {
  context('create template spec', () => {
    context('e2e', () => {
      const defaultSpecName = 'spec'
      const defaultSpecFileName = 'cypress/e2e/spec.cy.js'

      beforeEach(() => {
        const show = ref(true)

        cy.mount(() => (<div>
          <CreateSpecModal
            gql={{
              currentProject: {
                id: 'id',
                codeGenGlobs: {
                  id: 'super-unique-id',
                  __typename: 'CodeGenGlobs',
                  component: '**.vue',
                },
                codeGenFramework: 'vue',
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
                defaultSpecFileName,
              },
            }}
            show={show.value}
            onClose={() => show.value = false}
          />
        </div>))
      })

      testEmptySpecModal(defaultSpecFileName, defaultSpecName)
    })

    context('component', () => {
      const defaultSpecName = 'ComponentName'
      const defaultSpecFileName = 'src/components/ComponentName.cy.jsx'

      beforeEach(() => {
        const show = ref(true)

        cy.mount(() => (<div>
          <CreateSpecModal
            gql={{
              currentProject: {
                id: 'id',
                codeGenGlobs: {
                  id: 'super-unique-id',
                  __typename: 'CodeGenGlobs',
                  component: '**.vue',
                },
                codeGenFramework: 'vue',
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
                fileExtensionToUse: 'jsx',
                defaultSpecFileName,
              },
            }}
            show={show.value}
            onClose={() => show.value = false}
          />
        </div>))
      })

      testEmptySpecModal(defaultSpecFileName, defaultSpecName)
    })
  })

  context('general', () => {
    it('focuses text input but does not select if default file name does not match regex', () => {
      const show = ref(true)

      cy.mount(() => (<div>
        <CreateSpecModal
          gql={{
            currentProject: {
              id: 'id',
              codeGenGlobs: {
                id: 'super-unique-id',
                __typename: 'CodeGenGlobs',
                component: '**.vue',
              },
              codeGenFramework: 'vue',
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

      cy.findByRole('button', { name: 'Create new spec' }).should('be.visible').click()

      cy.focused().as('specNameInput')

      // focused should yield the input element since it should be auto-focused
      cy.get('@specNameInput').invoke('val').should('equal', 'this/path/does/not/produce/regex/match-')

      // nothing should be selected, so backspacing should only delete the last character in the file path
      cy.get('@specNameInput').type('{backspace}')

      cy.get('@specNameInput').invoke('val').should('equal', 'this/path/does/not/produce/regex/match')
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
            codeGenGlobs: {
              id: 'super-unique-id',
              __typename: 'CodeGenGlobs',
              component: '**.vue',
            },
            codeGenFramework: 'vue',
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

    cy.get('[data-cy="card"]').contains('Create new spec').click()
    cy.get('input').invoke('val').should('contain', 'spec.cy.js')
  })
})
