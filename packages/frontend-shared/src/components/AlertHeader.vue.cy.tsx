import AlertHeader from './AlertHeader.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these module imports
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
