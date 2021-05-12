import { initEnv, mount } from '@cypress/angular'
import { ScssStyleComponent } from './scss-style.component'

describe('ScssStyleComponent', () => {
  beforeEach(() => {
    initEnv(ScssStyleComponent)
  })

  it('should create', () => {
    mount(ScssStyleComponent)
    cy.get('#text').should('have.css', 'background-color', 'rgb(255, 0, 0)')
    cy.get('.works').should('have.css', 'color', 'rgb(0, 0, 255)')
  })
})
