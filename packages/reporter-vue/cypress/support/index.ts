import '../../src/main.scss'
import { mount } from '@cypress/vue'
import VTooltip from 'v-tooltip'
import 'virtual:windi.css'
import 'virtual:windi-devtools'
import DebugRenderer from './DebugRenderer.vue'

const tooltipOptions = {
  themes: {
    tooltip: {
      '$resetCss': true,
      triggers: ['click', 'hover'],
      placement: 'bottom',
      autoHide: true,
      strategy: 'absolute',
      handleResize: true,
    },
  },
}

Cypress.Commands.add('debugMount', (content) => {
  cy.viewport(600, 1000)
  mount(DebugRenderer, {
    slots: {
      default() {
        return JSON.stringify(content, null, 2)
      }
  }})
})


Cypress.Commands.add('mount', (component, options = {}) => {
  
  const global = options.global || {}
  delete options.global

  return mount(component, {
    global: {
      plugins: [[VTooltip, tooltipOptions]],
      ...global,
    },
    ...options,
  })
})
