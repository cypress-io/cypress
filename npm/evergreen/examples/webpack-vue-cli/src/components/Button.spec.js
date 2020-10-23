import Button from './Button'
import { mount } from '@vue/test-utils'
import $ from 'cash-dom'

window.mouse = mouse;
describe.only('Button',  () => {
  it('works', async () => {
    const wrapper = mount(Button, { attachTo: '#root' })
    expect(wrapper.exists()).to.be.ok

    await mouse.click($cyDom.getElementCoordinatesByPosition($(wrapper.vm.$el)).fromElViewport)

    expect(wrapper.html()).to.contain('Goodbye')
  })
})
