import { mount } from '@cypress/vue'
import Scaffoldgeneratorstepone from './ScaffoldGeneratorStepOne.vue'

describe('<Scaffoldgeneratorstepone />', () => {
  it('renders', () => {
    // see: https://vue-test-utils.vuejs.org/
    mount(Scaffoldgeneratorstepone, { props: {} })
  })
})
