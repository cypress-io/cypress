import { initEnvHtml, mountHtml } from '@cypress/angular'
import { AppModule } from '../../app.module'
import { HighlightDirective } from './highlight.directive'

describe('HighlightDirective', () => {
  it('should create an instance', () => {
    initEnvHtml(HighlightDirective)
    const fixture = mountHtml('<p appHighlight>Highlight me!</p>')

    fixture.detectChanges()
    cy.get('p')
    .should('have.css', 'background-color', 'rgb(255, 255, 0)')
    .should('contain', 'Highlight me!')
  })

  it('should create an instance', () => {
    initEnvHtml({ declarations: [HighlightDirective] })
    const fixture = mountHtml('<p appHighlight>Highlight me!</p>')

    fixture.detectChanges()
    cy.get('p')
    .should('have.css', 'background-color', 'rgb(255, 255, 0)')
    .should('contain', 'Highlight me!')
  })
})
