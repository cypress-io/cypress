import { mount } from '@cypress/vue'
import Filematchindicator from './FileMatchIndicator.vue'

describe('<Filematchindicator />', () => {
  it('renders', () => {
    // see: https://vue-test-utils.vuejs.org/
    mount(Filematchindicator, { props: {} })
  })
})
