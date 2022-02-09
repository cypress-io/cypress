import { mount } from '@cypress/vue'
import Componentgeneratorcard from './ComponentGeneratorCard.vue'

describe('<Componentgeneratorcard />', () => {
  it('renders', () => {
    // see: https://vue-test-utils.vuejs.org/
    mount(Componentgeneratorcard, { props: {} })
  })
})
