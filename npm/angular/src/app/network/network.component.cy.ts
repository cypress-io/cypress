import { HttpClientModule } from '@angular/common/http'
import { initEnv, mount } from '@cypress/angular'
import { NetworkService } from '../network.service'
import { NetworkComponent } from './network.component'

describe('Network', () => {
  describe('No mock', () => {
    beforeEach(() => {
      initEnv(NetworkComponent, {
        providers: [NetworkService],
        imports: [HttpClientModule],
      })
    })

    it('fetches 3 users from remote API', () => {
      mount(NetworkComponent)
      cy.get('li', { timeout: 20000 }).should('have.length', 3)
    })
  })

  describe('With mock', () => {
    beforeEach(() => {
      cy.intercept('/users?_limit=3', { body: [{ id: 1, name: 'foo' }] })
      initEnv(NetworkComponent, {
        providers: [NetworkService],
        imports: [HttpClientModule],
      })
    })

    it('fetch 1 user stubed', () => {
      mount(NetworkComponent)
      cy.get('li').should('have.length', 1).first().contains('foo')
    })
  })
})
