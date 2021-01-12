import { mount } from '@vue/test-utils'
import CrosswordBoard from '@/components/CrosswordBoard'
import {
  helloWorld as crossword,
  crossword as bigCrossword } from '../cypress/fixtures/crosswords'

describe('Crossword', () => {
  it('requires a crossword', () => {
    expect(() => mount(CrosswordBoard)).toThrow()
  })

  describe('successfully renders', () => {
    let wrapper

    beforeEach(async () => {
      wrapper = mount(CrosswordBoard, {
        propsData: {
          crossword,
          solved: true,
        },
      })

      await wrapper.vm.$nextTick()
    })

    it('renders props.msg when passed', async () => {
      expect(wrapper.exists()).toBeTruthy()
    })

    it('has a crossword puzzle', async () => {
      expect(wrapper.props('crossword')).toBeTruthy()
      expect(typeof wrapper.props('crossword')).toEqual('object')
    })

    it('renders the crossword puzzle successfully', () => {
      const cells = wrapper.findAll('[data-testid=crossword] [data-testid=cell]')

      expect(cells).toHaveLength(crossword.grid.length)
    })

    it('doesnt contain any placeholder dots', () => {
      const board = wrapper.find('[data-testid=crossword]')

      expect(board.text()).not.toContain('.')
    })

    it('numbers the crossword puzzle correctly', () => {
      const cells = wrapper.findAll('[data-testid=crossword] [data-testid=cell]')

      cells.wrappers.forEach((c, idx) => {
        if (crossword.gridnums[idx] > 0) {
          expect(c.text()).toContain(crossword.gridnums[idx])
        } else {
          expect(c.text()).not.toContain(0)
        }
      })
    })

    it('renders the correct number of rows and columns', () => {
      const rowsWrapper = wrapper.findAll('[data-testid=crossword] [data-testid=row]')

      expect(rowsWrapper.wrappers).toHaveLength(crossword.size.rows)
      const input = wrapper.find('[data-testid=crossword] [data-testid=row] input')

      expect(input.element.value).toEqual(crossword.grid[0])
    })
  })

  describe('larger board', () => {
    describe('solved', () => {
      it('renders successfully', async () => {
        const wrapper = await mount(CrosswordBoard, {
          propsData: { crossword: bigCrossword, solved: true },
        })

        await wrapper.vm.$nextTick()

        expect(wrapper.exists()).toBeTruthy()
      })
    })

    describe('unsolved', () => {
      it('renders successfully', async () => {
        const wrapper = mount(CrosswordBoard, {
          propsData: { crossword: bigCrossword, solved: false },
        })

        await wrapper.vm.$nextTick()

        expect(wrapper.exists()).toBeTruthy()
      })
    })
  })
})
