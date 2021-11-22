import { mount } from "@cypress/vue"
import Card from "./Card.vue"

describe('<Card />', () => {
  it('renders', () => {
    // see: https://vue-test-utils.vuejs.org/
    mount(Card, { props: {} })
  })
})