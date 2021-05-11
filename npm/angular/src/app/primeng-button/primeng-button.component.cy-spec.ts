import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { initEnv, mount, setConfig } from 'cypress-angular-unit-test'
import { ButtonModule } from 'primeng/button'
import { AppModule } from '../app.module'
import { PrimengButtonComponent } from './primeng-button.component'

describe('PrimengButtonComponent', () => {
  beforeEach(() => {
    setConfig({
      stylesheets: [
        'node_modules/primeng/resources/themes/saga-blue/theme.css',
        'node_modules/primeng/resources/primeng.min.css',
      ],
    })
  })

  it('should create', () => {
    initEnv(PrimengButtonComponent, {
      imports: [ButtonModule, BrowserAnimationsModule],
    })

    const fixture = mount(PrimengButtonComponent)

    fixture.detectChanges()
    cy.get('#directive')
    .should('have.text', 'Directive')
    .should('have.css', 'background-color', 'rgb(33, 150, 243)')

    cy.get('#component button')
    .should('have.text', 'Component')
    .should('have.css', 'background-color', 'rgb(33, 150, 243)')
  })

  it('should create with with AppModule', () => {
    initEnv({ imports: [AppModule] })
    const fixture = mount(PrimengButtonComponent)

    fixture.detectChanges()
    cy.get('#directive')
    .should('have.text', 'Directive')
    .should('have.css', 'background-color', 'rgb(33, 150, 243)')

    cy.get('#component button')
    .should('have.text', 'Component')
    .should('have.css', 'background-color', 'rgb(33, 150, 243)')
  })
})
