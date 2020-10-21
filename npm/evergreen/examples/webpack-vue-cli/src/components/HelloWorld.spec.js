import { mount } from '@vue/test-utils'
import HelloWorld from './HelloWorld'

describe('HelloWorld', () => {
  it('renders', () => {
    expect(true).to.eq(true)
    const wrapper = mount(HelloWorld,
      { propsData: { msg: 'Hello, universe!' }, attachTo: '#root' })

    expect(wrapper.exists()).to.be.ok
  })
})
