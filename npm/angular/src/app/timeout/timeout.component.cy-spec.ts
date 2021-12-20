import { fakeAsync, tick } from '@angular/core/testing'
import { initEnv, mount } from '@cypress/angular'

import { TimeoutComponent } from './timeout.component'

describe('Async', () => {
  it('simple async with setTimeout', fakeAsync(() => {
    let flag = false

    setTimeout(() => {
      flag = true
    }, 100000)

    expect(flag).equal(false)
    tick(50000)
    expect(flag).equal(false)
    tick(50000)
    expect(flag).equal(true)
  }))

  it('async in component', fakeAsync(() => {
    cy.clock()
    initEnv(TimeoutComponent)
    const fixture = mount(TimeoutComponent)

    cy.get('button').click()
    cy.get('#container').should('contain', 'Some message')
    cy.tick(20000).then(() => fixture.detectChanges())
    cy.get('#container').should('not.contain', 'Some message')
  }))
})
