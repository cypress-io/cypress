import { initEnv, mount } from '@cypress/angular'

import { OutputSubscribeComponent } from './output-subscribe.component'

describe('OutputSubscribeComponent', () => {
  beforeEach(() => {
    initEnv(OutputSubscribeComponent)
  })

  it('should get output value', () => {
    const fixture = mount(OutputSubscribeComponent)
    let counter = 0

    fixture.componentInstance.counterClick.subscribe((v) => (counter = v))
    cy.contains('output-subscribe works!')
    expect(counter).equals(0)
    cy.get('button')
    .click()
    .then(() => expect(counter).equals(1))

    cy.get('button')
    .click()
    .then(() => expect(counter).equals(2))
  })
})
