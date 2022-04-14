import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { initEnv, mount, setConfig } from '@cypress/angular'
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

  // FIXME: Support importing stylesheets from above the project root folder.
  it.skip('should create', () => {
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

  // FIXME: Support importing stylesheets from above the project root folder.
  it.skip('should create with with AppModule', () => {
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
