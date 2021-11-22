import { mount } from "@cypress/vue"
import Button from "./Button.vue"

describe('<Button />', () => {
  it('renders', () => {
    // see: https://vue-test-utils.vuejs.org/
    mount(Button, { props: {} })
  })
})