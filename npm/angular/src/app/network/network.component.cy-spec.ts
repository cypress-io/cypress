import { HttpClientModule } from '@angular/common/http'
import { initEnv, mount } from 'cypress-angular-unit-test'
import { NetworkService } from '../network.service'
import { NetworkComponent } from './network.component'

describe('Network', () => {
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
