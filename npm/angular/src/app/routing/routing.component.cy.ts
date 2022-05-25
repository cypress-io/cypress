import { RouterModule } from '@angular/router'
import { initEnv, mount } from '@cypress/angular'
import { routes } from '../routes'
import { PageOneComponent } from './page-one/page-one.component'
import { RoutingComponent } from './routing.component'

describe('RoutingComponent', () => {
  it('should create', () => {
    initEnv(RoutingComponent, {
      declarations: [PageOneComponent],
      imports: [RouterModule.forRoot(routes)],
    })

    mount(RoutingComponent)
    cy.contains('Page 1').click()
    cy.location('pathname').should('eq', '/page1')
    cy.contains('Page 2').click()
    cy.location('pathname').should('eq', '/page2')
  })
})
