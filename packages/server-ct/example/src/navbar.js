import { h } from 'vue'

const navTitle = `
  font-weight: bold;
  font-size: 18px;
`

const navbarBg = `
  background: #ff6600;
  padding: 5px;
  display: flex;
  justify-content: space-between;
`

export const Navbar = {
  setup (props, ctx) {
    const title = h('div', { style: navTitle, testId: 'header-title' }, 'Cypress Hacker News')

    const sortByAlpha = h('button', {
      onClick: () => ctx.emit('sortBy', 'alpha'),
    }, 'Alphabetically')
    const sortByPop = h('button', {
      onClick: () => ctx.emit('sortBy', 'popular'),
    }, 'Popular')

    return () => {
      return h(
        'div',
        {
          style: navbarBg,
          class: 'navbar',
        },
        [title, h('div', [sortByAlpha, sortByPop])],
      )
    }
  },
}
