import AlertHeader from './AlertHeader.vue'
import CoffeeIcon from '~icons/mdi/coffee'

describe('<AlertHeader />', () => {
  it('playground', () => {
    cy.mount(() => (
      <div class="p-4 text-center">
        <AlertHeader prefixIcon={CoffeeIcon} title="Coffee, please" suffixIcon={null}/>
        <AlertHeader />
        <AlertHeader />
      </div>
    ))
  })
})
