import Button from './Button'
import { mount } from '@vue/test-utils'
import $ from 'cash-dom'

async function retry(fn, n = 0) {
  try {
    await fn()
  } catch (err) {
    if (n > 20) throw err
    await new Promise((resolve) => setTimeout(resolve, 10))
    return retry(fn, n + 1)
  }
}

describe.only('Button',  () => {
  it('works', async () => {
    const wrapper = mount(Button, { attachTo: '#root' })
    expect(wrapper.exists()).to.be.ok

    await mouse.click(
      $cyDom.getElementCoordinatesByPosition($(wrapper.vm.$el))
        .fromElViewport
    )

    const getElementByTestId = id => document.querySelectorAll(`[data-testid=${id}`)[0]

    await retry(() => expect(getElementByTestId('byeButton').innerText).to.contain('Goodbye'))
  })
})
