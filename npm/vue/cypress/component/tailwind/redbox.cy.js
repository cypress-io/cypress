import { mount } from '@cypress/vue'
import RedBox from './RedBox.vue'
import './redbox.css'

const inlineStyle = 'body { background: blue; }'

// TODO: fix with https://github.com/cypress-io/cypress/issues/30706
describe.skip('RedBox 1', () => {
  const template = '<red-box :status="true" />'
  const options = {
    extensions: {
      components: {
        'red-box': RedBox,
      },
    },
  }

  it('displays red Hello RedBox', () => {
    mount({ template }, options)
    // should have injected the inline styling.
    cy.get('style').should('contain.text', inlineStyle)

    cy.contains('Hello RedBox')
    cy.get('[data-cy=box]')
    .should('have.css', 'background-color', 'rgb(255, 0, 0)')
    // and Tailwindcss style should have been applied
    .and('have.css', 'margin', '32px')
  })
})

// TODO: fix with https://github.com/cypress-io/cypress/issues/30706
describe.skip('RedBox 2', () => {
  const template = '<red-box :status="false" />'
  const options = {
    extensions: {
      components: {
        'red-box': RedBox,
      },
    },
  }

  beforeEach(() => {
    // should clean up links inserted via mounting options before each test.
    cy.get('link').should('not.exist')
    mount({ template }, options)
  })

  it('displays Goodbye RedBox', () => {
    // cleaned up inline <style> from previous test
    cy.get('style').should('not.contain.text', inlineStyle)
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
