import { mount } from '@cypress/vue'
import Emptygeneratorcard from './EmptyGeneratorCard.vue'

describe('<Emptygeneratorcard />', () => {
  it('renders', () => {
    // see: https://vue-test-utils.vuejs.org/
    mount(Emptygeneratorcard, { props: {} })
  })
})
