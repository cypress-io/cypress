import { mount } from '@cypress/vue'
import CalcDisplay from './Display.vue'

describe('<CalcDisplay />', () => {
  it('should look like a display', () => {
    mount(() => <CalcDisplay>8000</CalcDisplay>)
    cy.screenshot()
  })
})
