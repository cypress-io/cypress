import PromoHeader from './PromoHeader.vue'
import Button from '@cypress-design/vue-button'

describe('<PromoHeader />', () => {
  it('renders', () => {
    cy.mount(
      <PromoHeader
        title="I am a test header"
        v-slots={{
          description: () => <p>Description of this header</p>,
          control: () => <Button>Test Button</Button>,
          content: () => <div>Test Content</div>,
        }}
      />,
    )
  })
})
