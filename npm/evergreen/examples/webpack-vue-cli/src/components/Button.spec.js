import Button from './Button'
import { mount } from '@cypress/evergreen/dist/main.bundle'
import docs from '../../tests/plugins/docs'

async function retry(fn, n = 0) {
  try {
    await fn()
  } catch (err) {
    if (n > 20) throw err
    await new Promise((resolve) => setTimeout(resolve, 10))
    return retry(fn, n + 1)
  }
}

docs(Button)

describe('Button', () => {
  it('works', async () => {
    console.log('hello!!!')
    const wrapper = mount(Button)

    expect(wrapper.exists()).to.be.ok

    // This fails... because of some owner document issue.
    // await mouse.click(
    //   $cyDom.getElementCoordinatesByPosition($(wrapper.vm.$el))
    //     .fromElViewport
    // )

    await wrapper.trigger('click')
    const getElementByTestId = id => document.querySelectorAll(`[data-testid=${id}`)[0]

    await retry(() => expect(getElementByTestId('byeButton').innerText).to.contain('Goodbye'))
  })
})
