import { HttpClientModule } from '@angular/common/http'
import { InlineSVGModule } from 'ng-inline-svg'
import { mount, initEnv } from '@cypress/angular'
import { NgInlineSvgComponent } from './ng-inline-svg.component'

describe('NgInlineSvgComponent', () => {
  it('should create', () => {
    initEnv(NgInlineSvgComponent, {
      imports: [InlineSVGModule.forRoot(), HttpClientModule],
    })

    mount(NgInlineSvgComponent)
    cy.get('svg').should('be.visible')
    cy.get('path').eq(0).should('have.attr', 'fill', '#F0DB4F')
  })
})
