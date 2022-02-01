import StandardModal from './StandardModal.vue'
import { defaultMessages } from '@cy/i18n'
import { ref } from 'vue'

const title = 'Test Title'
const body = 'Test body text'

describe('<StandardModal />', { viewportWidth: 500, viewportHeight: 400 }, () => {
  describe('default render and variations', () => {
    it('renders expected content in open state', () => {
      const isOpen = ref(true)

      cy.mount(<StandardModal
        class="w-400px"
        modelValue={isOpen.value}
        title={title}
      >{body}
      </StandardModal>)

      cy.contains('a', defaultMessages.links.needHelp)
      .should('be.visible')
      .and('have.attr', 'href', 'https://on.cypress.io')

      cy.findByLabelText(defaultMessages.actions.close, {
        selector: 'button',
      })
      .should('be.visible')
      .and('not.be.disabled')

      cy.contains('h2', title).should('be.visible')
      cy.contains(body).should('be.visible')

      cy.percySnapshot()
    })

    it('bare variant renders without padding in body', () => {
      cy.mount(<StandardModal
        class="w-400px"
        modelValue={true}
        title={title}
        variant="bare"
      >{body}
      </StandardModal>)

      cy.contains(title).should('be.visible')

      cy.percySnapshot()
    })

    it('click-outside can be turned off', () => {
      const updateSpy = cy.spy().as('updateSpy')
      const props = {
        'onUpdate:modelValue': (value) => updateSpy(value),
      }

      cy.mount(<StandardModal
        class="w-400px"
        modelValue={true}
        title={title}
        clickOutside={false}
        {...props}
      >{body}
      </StandardModal>)

      cy.contains(title).should('be.visible')
      cy.get('body').click()

      cy.get('@updateSpy').should('not.have.been.called')
    })

    it('optional classes pass through to the modal root element', () => {
      const testClass = 'text-pink-400'

      cy.mount(<StandardModal
        class={`${testClass } w-400px`}
        modelValue={true}
        title={title}
        clickOutside={false}
      >{body}
      </StandardModal>)

      cy.contains(title).should('be.visible')
      .closest(`[data-cy=standard-modal].${testClass}`)
      .should('exist')

      cy.percySnapshot()
    })
  })

  describe('mouse and keyboard behavior', () => {
    beforeEach(() => {
      const isOpen = ref(true)
      const updateSpy = cy.spy().as('updateSpy')

      const props = {
        'onUpdate:modelValue': (value) => {
          updateSpy(value)
          isOpen.value = value
        },
      }

      cy.mount(<StandardModal
        class="w-400px"
        modelValue={isOpen.value}
        title={title}
        {...props}
      >{body}
      </StandardModal>)

      cy.findByLabelText(defaultMessages.actions.close, {
        selector: 'button',
      }).as('closeButton')
    })

    it('closes when Close button is clicked', () => {
      cy.get('@closeButton')
      .click()
      .then(() => {
        cy.get('@updateSpy').should('have.been.calledOnceWith', false)
      })
    })

    it('closes with Space key on close button', () => {
      cy.get('@closeButton').focus().realPress('Space')
      cy.get('@updateSpy').should('have.been.calledOnceWith', false)
    })

    it('closes with enter key on close button', () => {
      cy.get('@closeButton').focus().realPress('Enter')
      cy.get('@updateSpy').should('have.been.calledOnceWith', false)
    })

    it('closes with Esc key', () => {
      cy.get('body').type('{esc}')
      cy.get('@updateSpy').should('have.been.calledOnceWith', false)
    })

    it('closes with click-outside by default', () => {
      cy.get('body').click()
      cy.get('@updateSpy').should('have.been.calledOnceWith', false)
    })

    it('doesn\'t close with click inside', () => {
      cy.contains(title).click()
      cy.get('@updateSpy').should('not.have.been.called')
    })
  })
})
