import $ from 'cash-dom'
import { Story } from './story'
import { createApp } from 'vue'

function mount (comp, { props }) {
  $('body').html('')
  const $root = $(`<div id="counter-root"/>`)

  $root.html('') // cleaning up between tests
  $('body').append($root)

  const app = createApp(comp, props)

  app.mount('#counter-root')
}

describe('story', () => {
  it('works', () => {
    mount(Story, {
      props: {
        story: {
          id: 1,
          name: 'Apple M1 Assembly Language Hello World',
          url: '(smist08.wordpress.com)',
        },
      },
    })

    cy.get('.story').contains('Apple M1')
    cy.get('.hn-small').contains('wordpress.com')
  })
})
