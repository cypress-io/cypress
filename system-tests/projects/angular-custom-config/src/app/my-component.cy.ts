import { MyComponent } from './my-component'

describe('MyComponent', () => {
  it('should mount with an h1 tag with a class of very-red', () => {
    cy.mount(MyComponent)
    // Proves out the Angular specific `projectConfig` option. The global styles in `custom-styles.scss` would not normally be applied with how this project's `angular.json`
    // is configured. By utilizing the `projectConfig` option in `component.devServer.options`, we can change the
    // build options to allow this global style to be loaded
    cy.get('h1').should('have.css', 'color', 'rgb(255, 0, 0)')
  })
})
