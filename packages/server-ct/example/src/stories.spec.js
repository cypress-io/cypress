import $ from 'cash-dom'
import { Stories } from './stories'
import { createApp } from 'vue'

function mount (comp, { props }) {
  $('body').html('')
  const $root = $(`<div id="counter-root"/>`)

  $root.html('') // cleaning up between tests
  $('body').append($root)

  const app = createApp(comp, props)

  app.mount('#counter-root')
}

const stories = [
  {
    name: 'Apple M1 chip is pretty fast',
    url: '(smist08.wordpress.com)',
    points: 100,
  },
  {
    name: 'Aquafaba',
    url: '(aquafaba.com)',
    points: 350,
  },
  {
    name: 'Oberon OS Walkthrough',
    url: '(ignorethecode.net)',
    points: 25,
  },
  {
    name: 'Debian 11 bullseye freeze started',
    url: ' (debian.org)',
    points: 105,
  },
]

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
      },
    })

    cy.get('[testid="1"]').contains('Apple M1')
    cy.get('[testid="4"]').contains('Oberon')

    cy.get('button').contains('Popular').click()

    cy.get('[testid="1"]').contains('Oberon')
    cy.get('[testid="4"]').contains('Aquafaba')
  })
})
