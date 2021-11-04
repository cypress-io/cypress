import TestingPreferences from './TestingPreferences.vue'

describe('<TestingPreferences />', () => {
  it('renders', () => {
    cy.mount(() => <div class="p-24px"><TestingPreferences /></div>)
  })
})
