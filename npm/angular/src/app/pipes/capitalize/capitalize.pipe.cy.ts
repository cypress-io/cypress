import { initEnvHtml, mountHtml } from '@cypress/angular'
import { CapitalizePipe } from './capitalize.pipe'

describe('CapitalizePipe', () => {
  it('should create an instance', () => {
    initEnvHtml(CapitalizePipe)
    const fixture = mountHtml(`<p>{{ 'hey' | capitalize }}</p>`)

    fixture.detectChanges()
    cy.get('p').contains('HEY')
  })

  it('should create an instance, module style', () => {
    initEnvHtml({ declarations: [CapitalizePipe] })
    const fixture = mountHtml(`<p>{{ 'hey' | capitalize }}</p>`)

    fixture.detectChanges()
    cy.get('p').contains('HEY')
  })
})
