import { initEnv, mount } from '@cypress/angular'
import { AppModule } from '../app.module'
import { InputComponent } from './input.component'

describe('InputComponent', () => {
  it('should show default value input', () => {
    initEnv(InputComponent)
    mount(InputComponent)
    cy.contains('My input value 4')
  })

  it('should replace default value input', () => {
    initEnv({ declarations: [InputComponent] })
    mount(InputComponent, { myInput: 9 })
    cy.contains('My input value 9')
  })

  it('should show default value input with AppModule', () => {
    initEnv({ imports: [AppModule] })
    mount(InputComponent)
    cy.contains('My input value 4')
  })
})
