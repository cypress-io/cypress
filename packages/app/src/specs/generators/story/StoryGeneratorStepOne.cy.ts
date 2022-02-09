import { mount } from '@cypress/vue'
import Storygeneratorstepone from './StoryGeneratorStepOne.vue'

describe('<Storygeneratorstepone />', () => {
  it('renders', () => {
    // see: https://vue-test-utils.vuejs.org/
    mount(Storygeneratorstepone, { props: {} })
  })
})
