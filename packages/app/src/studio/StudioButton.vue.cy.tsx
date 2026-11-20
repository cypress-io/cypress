import { createEventManager } from '../../cypress/component/support/ctSupport'
import { useStudioStore } from '../store/studio-store'
import StudioButton from './StudioButton.vue'

const mountStudioButton = (eventManager = createEventManager()) => {
  return cy.mount(<StudioButton eventManager={eventManager}/>)
}

describe('StudioButton', () => {
  it('should open studio panel when studio panel is closed', () => {
    const eventManager = createEventManager()

    const studioInitSuiteSpy = cy.stub().as('studioInitSuiteSpy')

    cy.spy(eventManager, 'emit').as('eventManagerSpy')

    mountStudioButton(eventManager)
    eventManager.on('studio:init:suite', () => {
      studioInitSuiteSpy()
    })

    cy.get('[data-cy="studio-button"]').click()
    cy.get('@studioInitSuiteSpy').should('have.been.called')
  })

  it('should close studio panel when studio panel is open', () => {
    const studioStore = useStudioStore()
    const eventManager = createEventManager()
    const studioCancelSpy = cy.stub().as('studioCancelSpy')

    cy.spy(eventManager, 'emit').as('eventManagerSpy')

    mountStudioButton(eventManager)

    // simulate having the studio open
    studioStore.startLoading()

    eventManager.on('studio:cancel', () => {
      studioCancelSpy()
    })

    expect(studioStore.isOpen).to.be.true

    //clicking on the studio button again should close the studio panel
    cy.get('[data-cy="studio-button"]').click()
    cy.get('@studioCancelSpy').should('have.been.called')
  })
})
