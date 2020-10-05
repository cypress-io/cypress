/// <reference types="cypress" />
import { mount } from '@cypress/vue'
import ParentComponent from './Parent.vue'

describe('Mocking components', () => {
  beforeEach(() => {
    // by deleting _Ctor we force Vue system to recompile the
    // component and render the new component tree
    delete ParentComponent._Ctor
  })

  it('renders real child component', () => {
    mount(ParentComponent)
    cy.get('.a-parent')
    cy.get('.a-child')
  })

  it('mocks Child component imported by the Parent component', () => {
    // alternative 1:
    //
    // replace the real component with a mock component
    // could be done "manually", but would require restoring the real
    // ".components" object after this test
    //
    // ParentComponent.components = {
    //   ChildComponent: {
    //     template: '<div class="test-child">Test component</div>',
    //   },
    // }

    // alternative 2:
    //
    // use built-in cy.stub method https://on.cypress.io/stub
    // that are reset automatically before every test
    cy.stub(ParentComponent, 'components', {
      ChildComponent: {
        template: '<div class="test-child">Test component</div>',
      },
    })

    mount(ParentComponent)
    cy.get('.a-parent')
    cy.get('.test-child')
    cy.get('.a-child').should('not.exist')
  })

  // and how to reset the mocked child component?
  it('renders real child component again', () => {
    mount(ParentComponent)
    cy.get('.a-parent')
    cy.get('.a-child')
  })
})
