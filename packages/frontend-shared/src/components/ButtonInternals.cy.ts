import { mount } from "@cypress/vue"
import Buttoninternals from "./ButtonInternals.vue"

describe('<Buttoninternals />', () => {
  it('renders', () => {
    // see: https://vue-test-utils.vuejs.org/
    mount(Buttoninternals, { props: {} })
  })
})