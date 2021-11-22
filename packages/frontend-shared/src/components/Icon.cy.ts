import { mount } from "@cypress/vue"
import Icon from "./Icon.vue"

describe('<Icon />', () => {
  it('renders', () => {
    // see: https://vue-test-utils.vuejs.org/
    mount(Icon, { props: {} })
  })
})