import faker from 'faker'
import TrackedWarning from './TrackedWarning.vue'
import { ref } from 'vue'
import { defaultMessages } from '@cy/i18n'

describe('<TrackedWarning />', () => {
  it('calls dismiss when X is clicked', () => {
    const title = faker.hacker.noun()
    const message = `
  # Hello!
  > This is a **markdown formatted** message!
  
  We're going to print out some \`console.log('cool code')\` and see how well it formats inside of our warning.
  `
    const bannerId = 'test123'
    const show = ref(true)
    const onUpdate = cy.spy()
    const methods = {
      'onUpdate:modelValue': (value) => {
        show.value = value
        onUpdate()
      },
    }

    cy.mount(() => (<div class="p-4"><TrackedWarning
      data-testid="warning"
      title={title}
      message={message}
      bannerId={bannerId}
      {...methods}
    /></div>))

    cy.get('[data-testid=warning]').as('warning')

    cy.get('@warning').should('be.visible')
    cy.get(`[aria-label=${defaultMessages.components.alert.dismissAriaLabel}`).first().click()
    cy.wrap(onUpdate).should('be.called')
    cy.get('@warning').should('not.exist')
  })
})
