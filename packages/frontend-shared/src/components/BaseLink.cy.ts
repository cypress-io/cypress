import { mount } from "@cypress/vue"
import Baselink from "./BaseLink.vue"

describe('<Baselink />', () => {
  it('renders', () => {
    // see: https://vue-test-utils.vuejs.org/
    mount(Baselink, { props: {} })
  })
})