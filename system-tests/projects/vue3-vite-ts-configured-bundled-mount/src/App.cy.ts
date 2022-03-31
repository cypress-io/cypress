import { mount } from 'cypress/vue'
import App from './App.vue'

describe('<App />', () => {
  it('renders', () => {
    // see: https://vue-test-utils.vuejs.org/
    mount(App, { props: {} })
  })
})
