import Button from './Button'
import { render, fireEvent } from '@testing-library/vue'

// This rerenders improperly for re-runs
xdescribe('Testing Library Button',  () => {
  it('works', async () => {
    const { getByTestId } = render(Button)

    const button = getByTestId('byeButton')

    await fireEvent.click(button)

    expect(button.innerText).to.contain('Goodbye')

    await fireEvent.click(button)

    expect(button.innerText).to.contain('Hello')
  })
})
