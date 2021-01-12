import { mount } from '@vue/test-utils'
import App from '@/App'
import { crossword } from '../cypress/fixtures/crosswords'
import { fillCrossword, getCrossword } from './jestHelpers'

global.fetch = jest.fn(() => {
  return Promise.resolve({
    json: () => Promise.resolve({}),
  })
})

fetch.mockImplementationOnce(() => {
  return Promise.resolve({
    json: () => Promise.resolve(crossword),
  })
})

beforeEach(() => {
  fetch.mockClear()
})

describe('App', () => {
  let wrapper

  beforeEach(async () => {
    fetch.mockImplementationOnce(() => {
      return Promise.resolve({
        json: () => Promise.resolve(crossword),
      })
    })

    wrapper = mount(App)
    await wrapper.vm.$nextTick()
  })

  it('renders the crossword puzzle on load', function () {
    const crossword = wrapper.find('[data-testid=crossword]')

    expect(crossword.exists()).toBeTruthy()
  })

  it('lets you navigate to previous days', async () => {
    const title = wrapper.find('[data-testid=crossword-title]')
    const oldTitle = title.text()

    wrapper.find('[data-testid=prev]').trigger('click')
    await wrapper.vm.$nextTick()

    const newTitle = wrapper.find('[data-testid=crossword-title]').text()

    expect(newTitle).not.toEqual(oldTitle)

    wrapper.find('[data-testid=next]').trigger('click')
    await wrapper.vm.$nextTick()

    const backToTheOldTitle = wrapper.find('[data-testid=crossword-title]').text()

    expect(backToTheOldTitle).toEqual(oldTitle)
  })

  it('rerenders the crossword when you go to another day', async () => {
    const crosswordWrapper = wrapper.find('[data-testid=crossword]')

    fillCrossword(crosswordWrapper.findAll('input').wrappers, { partially: true, crossword })

    await wrapper.vm.$nextTick()

    wrapper.find('[data-testid=prev]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(getCrossword(wrapper.findAll('[data-testid=crossword] input'))).toEqual('')

    wrapper.find('[data-testid=next]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(getCrossword(wrapper.findAll('[data-testid=crossword] input'))).toEqual('')
  })

  it('resets the crossword correctly after you fill it in', async () => {
    const crosswordWrapper = wrapper.find('[data-testid=crossword]')

    fillCrossword(crosswordWrapper.findAll('input').wrappers, { crossword, partially: true })

    await wrapper.vm.$nextTick()

    const oldTitle = wrapper.find('[data-testid=crossword-title]').text()
    const oldCrossword = getCrossword(wrapper.findAll('[data-testid=crossword] input'))

    wrapper.find('[data-testid=reset]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid=crossword]').text()).not.toEqual(oldCrossword)
    expect(wrapper.find('[data-testid=crossword-title]').text()).toEqual(oldTitle)
  })
})
