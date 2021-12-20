import { initEnv, mount, setConfig } from '@cypress/angular'
import { OnPushStratComponent } from './on-push-strat.component'

describe('OnPush strategy', () => {
  beforeEach(() => {
    setConfig({ detectChanges: false })
    initEnv(OnPushStratComponent)
  })

  it('mount work', () => {
    const data = 'It works onPush'
    const fixture = mount(OnPushStratComponent, { data })

    fixture.detectChanges()
    cy.contains(data)
  })
})
