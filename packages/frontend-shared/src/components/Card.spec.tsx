import Card from './Card.vue'
import IconE2E from '~icons/cy/testing-type-e2e_x64.svg'
import IconE2ESolid from '~icons/cy/testing-type-e2e-solid_x64.svg'
import IconComponent from '~icons/cy/testing-type-component_x64.svg'
import IconComponentSolid from '~icons/cy/testing-type-component-solid_x64.svg'

describe('Card', () => {
  it('renders with icons as an image', () => {
    cy.mount(() => {
      return (<div class="flex justify-center m-32px">
        <Card
          title="E2E Testing"
          class="m-16px px-40px pt-36px pb-32px w-336px"
          description="Build and test the entire experience of your application from end-to-end to each ensure each flow matches your expectations."
          icon={IconE2E}
          hoverIcon={IconE2ESolid}
          iconSize={64}
          variant='jade'/>
        <Card
          title="Component Testing"
          class="m-16px px-40px pt-36px pb-32px w-336px"
          description="Build and test your components from your design system in isolation in order to ensure each state matches your expectations."
          iconSize={64}
          icon={IconComponent}
          hoverIcon={IconComponentSolid}
          variant='jade'/>
      </div>)
    })
  })
})
