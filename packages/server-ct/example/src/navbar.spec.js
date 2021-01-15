import $ from 'cash-dom'
import { Navbar } from './navbar'
import { createApp } from 'vue'

function mount (comp, { props } = { props: {} }) {
  $('body').html('')
  const $root = $(`<div id="counter-root"/>`)

  $root.html('') // cleaning up between tests
  $('body').append($root)

  const app = createApp(comp, props)

  app.mount('#counter-root')
}

describe('story', () => {
  it('works', () => {
    mount(Navbar)

    // how the heck to test emitted events?
    // do we even care about this?
    // I guess we can use cy.stub or something :thinking emoji:
  })
})
