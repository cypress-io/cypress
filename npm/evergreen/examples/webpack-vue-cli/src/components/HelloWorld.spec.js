import { mount } from '@vue/test-utils'
// import * as mouse from '@packages/driver/src/cy/mouse'
import HelloWorld from './HelloWorld'

describe('HelloWorld', () => {
  it('renders', () => {
    expect(true).to.eq(true)
    const wrapper = mount(HelloWorld,
      { propsData: { msg: 'Hello, BenK!!' }, attachTo: '#root' })

    expect(wrapper.exists()).to.be.ok
    mouse.click($cyDom.getElementCoordinatesByPosition(wrapper.vm.$el).fromElViewport)
  })
})
