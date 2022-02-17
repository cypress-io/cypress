import ResizeObserverBug from './ResizeObserverBug.vue'

describe('reproduction', () => {
  test('uses resize observer', () => {
    cy.mount(ResizeObserverBug)
  })
})
