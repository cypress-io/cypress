import AlertHeader from './AlertHeader.vue'
import CoffeeIcon from '~icons/mdi/coffee'

describe('<AlertHeader />', () => {
  it('playground', () => {
    cy.mount(() => (
      <div class="text-center p-4">
        <AlertHeader prefixIcon={CoffeeIcon} title="Coffee, please" suffixIcon={null}/>
        <AlertHeader title="Alert" />
        <AlertHeader title="Alert" />
      </div>
    ))
  })
})
