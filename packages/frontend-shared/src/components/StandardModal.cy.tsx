import StandardModal from './StandardModal.vue'
import Tooltip from './Tooltip.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { DialogOverlay } from '@headlessui/vue'
import { ref } from 'vue'

const title = 'Test Title'
const body = 'Test body text'

describe('<StandardModal />', { viewportWidth: 800, viewportHeight: 400 }, () => {
  describe('default render and variations', () => {
    it('renders expected content in open state', () => {
      const isOpen = ref(true)

      cy.mount(<StandardModal
        class="w-[400px]"
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

    it('does not render helpLink when noHelp is true', () => {
      cy.mount(
        <StandardModal
          class="w-[400px]"
          modelValue={true}
          noHelp={true}
          title={title}
        >
          {body}
        </StandardModal>,
      )

      cy.contains('a', defaultMessages.links.needHelp).should('not.exist')

      cy.findByLabelText(defaultMessages.actions.close, {
        selector: 'button',
      })
      .should('be.visible')
      .and('not.be.disabled')

      cy.contains('h2', title).should('be.visible')
      cy.contains(body).should('be.visible')
    })

    it('bare variant renders without padding in body', () => {
      cy.mount(<StandardModal
        class="w-[400px]"
        modelValue={true}
        title={title}
        variant="bare"
      >{body}
      </StandardModal>)

      cy.contains(title).should('be.visible')

      cy.percySnapshot()
    })

    it('optional classes pass through to the modal root element', () => {
      const testClass = 'text-pink-400'

      cy.mount(<StandardModal
        class={`${testClass } w-[400px]`}
        modelValue={true}
        title={title}
      >{body}
      </StandardModal>)

      cy.contains(title).should('be.visible')
      .closest(`[data-cy=standard-modal].${testClass}`)
      .should('exist')

      cy.findByTestId('external').should('be.visible').should('have.attr', 'href', 'https://on.cypress.io')
      cy.findByLabelText('Close').should('be.visible')
    })

    it('automatically closes tooltips on open', () => {
      const tooltipSlots = {
        default: () => <div data-cy="tooltip-trigger">Trigger</div>,
        popper: () => <div data-cy="tooltip-content">Tooltip Content</div>,
      }
      const modalSlots = {
        default: () => <div>Modal Content!</div>,
        overlay: ({ classes }) => <DialogOverlay class={[classes, 'bg-gray-800', 'opacity-90']} />,
      }
      const isOpen = ref(false)

      cy.mount(() => (
        <div>
          <Tooltip v-slots={tooltipSlots} isInteractive />
          <StandardModal v-slots={modalSlots} modelValue={isOpen.value} />
        </div>
      ))

      // Open tooltip
      cy.findByTestId('tooltip-trigger').trigger('mouseenter')

      // Wait for tooltip to be visible
      cy.findByTestId('tooltip-content')
      .should('be.visible')
      .then(() => {
        // Open modal
        isOpen.value = true
      })

      // Verify tooltip is no longer open once modal was opened
      cy.findByTestId('tooltip-content')
      .should('not.exist')
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
        class="w-[400px]"
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

    it('closes with click-outside', () => {
      cy.get('body').click()
      cy.get('@updateSpy').should('have.been.calledOnceWith', false)
    })

    it('does not close w/ click-outside when viewport is xs', { viewportWidth: 400 }, () => {
      cy.get('body').click()
      cy.get('@updateSpy').should('not.have.been.called')
    })

    it(`doesn't close with click inside`, () => {
      cy.contains(title).click()
      cy.get('@updateSpy').should('not.have.been.called')
    })
  })
})
