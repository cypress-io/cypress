import $ from 'cash-dom'
import { App } from './app'
import { createApp } from 'vue'
import { stories } from './fixtures'

function mount (comp, { props } = { props: {} }) {
  $('body').html('')
  const $root = $(`<div id="counter-root"/>`)

  $root.html('') // cleaning up between tests
  $('body').append($root)

  const app = createApp(comp, props)

  app.mount('#counter-root')
}

describe('app', () => {
  it('renders the entire app', () => {
    mount(App, {
      props: {
        stories,
      },
    })

    cy.get('[testId="header-title"]')
  })

  it('sorts stories', () => {
    mount(App, {
      props: {
        stories,
      },
    })

    cy.get('[testId="header-title"]')
    cy.get('[testid="1"]').contains('Apple M1')
    cy.get('[testid="4"]').contains('Oberon')

    cy.get('button').contains('Popular').click()

    cy.get('[testid="1"]').contains('Oberon')
    cy.get('[testid="4"]').contains('Aquafaba')
  })
})
