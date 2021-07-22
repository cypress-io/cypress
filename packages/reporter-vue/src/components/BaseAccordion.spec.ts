import { defineComponent, createSlots, h } from 'vue'
import BaseAccordion from './BaseAccordion.vue'

it('renders', () => {
  const accordion = defineComponent({
    data() {
      return {
        open: false
      }
    },
    render() {
      const self = this
      return h(BaseAccordion, {
        modelValue: self.open,
        'onUpdate:modelValue': () => self.open = !self.open
      },
        createSlots({
          default: () => h('h1', 'inner content'),
          header: () => h('header', [h('p', 'Header Content')])
        }, {})
      )
    },
  })

  cy.mount(accordion)
    .get('header').as('header')
    .should('contain.text', 'Header Content')
    .get('@header')
    .click()
    .get('h1')
    .should('be.visible')
    .should('contain.text', `inner content`)
    .get('@header')
    .click()
    .get('h1')
    .should('not.exist')
})