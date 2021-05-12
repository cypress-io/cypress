import { initEnv, mount, setConfig } from '@cypress/angular'
import { AppModule } from '../app.module'
import { AddStyleComponent } from './add-style.component'

describe('AddStyleComponent', () => {
  beforeEach(() => {
    setConfig({ style: 'p {background-color: blue;}' })
  })

  it('should create', () => {
    initEnv(AddStyleComponent)
    mount(AddStyleComponent)
    cy.get('p')
    .should('contain', 'add-style works!')
    .should('have.css', 'color', 'rgb(255, 0, 0)')
    .should('have.css', 'background-color', 'rgb(0, 0, 255)')
  })

  it('should create with AppModule', () => {
    initEnv({ imports: [AppModule] })
    mount(AddStyleComponent)
    cy.get('p')
    .should('contain', 'add-style works!')
    .should('have.css', 'color', 'rgb(255, 0, 0)')
    .should('have.css', 'background-color', 'rgb(0, 0, 255)')
  })
})
