import { mount, mountCallback } from '@cypress/vue'
import RedBox from './RedBox.vue'

describe('RedBox 1', () => {
  const template = '<red-box :status="true" />'
  const options = {
    extensions: {
      components: {
        'red-box': RedBox,
      },
    },
    // you can inject additional styles to be downloaded
    //
    stylesheets: [
      // you can use external links
      'https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css',
    ],
  }

  it('displays red Hello RedBox', () => {
    mount({ template }, options)

    cy.contains('Hello RedBox')
    cy.get('[data-cy=box]')
    .should('have.css', 'background-color', 'rgb(255, 0, 0)')
    // and Tailwindcss style should have been applied
    .and('have.css', 'margin', '32px')
  })
})

describe('RedBox 2', () => {
  const template = '<red-box :status="false" />'
  const options = {
    extensions: {
      components: {
        'red-box': RedBox,
      },
    },
    stylesheets: [
      // you can use external links
      'https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css',
    ],
  }

  beforeEach(mountCallback({ template }, options))
  it('displays Goodbye RedBox', () => {
    cy.contains('Goodbye RedBox')
  })

  it('should be Red', () => {
    cy.get('[data-cy=box]').should(
      'have.css',
      'background-color',
      'rgb(255, 0, 0)',
    )
  })
})
