import $ from 'cash-dom'
import { Stories } from './stories'
import { stories } from './fixtures'
import { createApp } from 'vue'

function mount (comp, { props }) {
  $('body').html('')
  const $root = $(`<div id="counter-root"/>`)

  $root.html('') // cleaning up between tests
  $('body').append($root)

  const app = createApp(comp, props)

  app.mount('#counter-root')
}

describe('stories', () => {
  it('renders many stories', () => {
    mount(Stories, {
      props: {
        stories,
      },
    })

    cy.get('.story').should('have.length', stories.length)
  })

  it('renders a fallback message when no stories are there', () => {
    mount(Stories, {
      props: {
        stories: [],
      },
    })

    cy.get('div').contains('Please check back later')
  })

  it('sorts by alpha order by default', () => {
    mount(Stories, {
      props: {
        stories,
      },
    })

    cy.get('[testid="1"]').contains('Apple M1')
    cy.get('[testid="4"]').contains('Oberon')
  })

  it('sorts by popularity', () => {
    mount(Stories, {
      props: {
        stories,
        sortBy: 'popular',
      },
    })

    cy.get('[testid="1"]').contains('Oberon')
    cy.get('[testid="4"]').contains('Aquafaba')
  })
})
