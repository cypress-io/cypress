import { StandaloneComponent } from './standalone.component'

describe('StandaloneComponent', () => {
  it('can mount a standalone component', () => {
    cy.mount(StandaloneComponent, {
      componentProperties: {
        name: 'Angular',
      },
    })

    cy.get('h1').contains('Hello Angular')
  })

  it('can mount a standalone component using template', () => {
    cy.mount('<app-standalone name="Angular"></app-standalone>', {
      imports: [StandaloneComponent],
    })

    cy.get('h1').contains('Hello Angular')
  })
})
