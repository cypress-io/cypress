import { h } from 'vue'

// indigo-100 and gray-900 from @cypress-design/css
const INDIGO_100 = 'rgb(218, 221, 254)'
const GRAY_900 = 'rgb(46, 50, 71)'

describe('text selection', () => {
  beforeEach(() => {
    cy.mount(() => {
      return h('div', [
        h('div', { class: 'bg-white p-[16px]' }, [
          h('input', { 'data-cy': 'light-input', class: 'border border-gray-100 text-gray-700', value: 'cypress/e2e/ComponentName.cy.ts' }),
          h('textarea', { 'data-cy': 'light-textarea', class: 'border border-gray-100 text-gray-700', value: 'Ada Lovelace' }),
          h('p', { 'data-cy': 'light-text', class: 'text-gray-600' }, 'Create a new spec'),
        ]),
        h('div', { class: 'bg-gray-1000 p-[16px]' }, [
          h('input', { 'data-cy': 'dark-input', class: 'bg-gray-1000 border-0 text-gray-500', value: 'LoginForm.cy.tsx' }),
          h('p', { 'data-cy': 'dark-text', class: 'text-white' }, 'Specs'),
        ]),
      ])
    })
  })

  // Light text, as on the dark sidebars and in the reporter, is unreadable on
  // indigo-100, so the highlight sets its own text color too.
  ;['light-input', 'light-textarea', 'light-text', 'dark-input', 'dark-text'].forEach((selector) => {
    it(`highlights selected text in ${selector} with indigo-100 behind gray-900`, () => {
      cy.get(`[data-cy="${selector}"]`).then(($el) => {
        const selection = window.getComputedStyle($el[0], '::selection')

        expect(selection.backgroundColor).to.eq(INDIGO_100)
        expect(selection.color).to.eq(GRAY_900)
      })
    })
  })
})
