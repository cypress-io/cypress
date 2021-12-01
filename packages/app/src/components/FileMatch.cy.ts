import { mount } from '@cypress/vue'
import Filematch from './FileMatch.vue'

describe('<Filematch />', () => {
  it('renders', () => {
    // see: https://vue-test-utils.vuejs.org/
    mount(Filematch, { props: {} })
  })
})
