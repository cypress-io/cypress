import React from 'react'
import { useScrollIntoView } from './useScrollIntoView'
import { AppState } from './app-state'
import scroller from './scroller'

// Test component to render the hook
const TestComponent = ({ appState, testState, isStudioActive }: {
  appState: AppState
  testState?: string
  isStudioActive?: boolean
}) => {
  const { containerRef, isMounted, scrollIntoView } = useScrollIntoView({
    appState,
    testState,
    isStudioActive,
  })

  return (
    <div>
      <div data-cy="mounted-status">{isMounted ? 'mounted' : 'not-mounted'}</div>
      <div ref={containerRef} data-cy="scroll-container" style={{ height: '100px', width: '100px' }}>
        Scroll target
      </div>
      <button data-cy="scroll-button" onClick={scrollIntoView}>
        Scroll
      </button>
    </div>
  )
}

describe('useScrollIntoView', () => {
  let mockAppState: AppState

  beforeEach(() => {
    // Reset scroller to avoid container errors
    scroller.__reset()

    // Create a mock container for the scroller
    const mockContainer = {
      clientHeight: 400,
      scrollHeight: 900,
      scrollTop: 0,
      addEventListener: cy.stub(),
    } as unknown as Element

    // Set the container on the scroller
    scroller.setContainer(mockContainer)

    // Mock app state with auto-scrolling disabled by default
    mockAppState = {
      isRunning: false,
      isPaused: false,
      autoScrollingEnabled: false, // Start with false to prevent unwanted calls
      scrollTop: 0,
      user: null,
      preferences: {},
    } as unknown as AppState

    // Spy on scroller.scrollIntoView
    cy.spy(scroller, 'scrollIntoView').as('scrollIntoViewSpy')
  })

  it('sets isMounted to true after initial render', () => {
    cy.mount(
      <TestComponent
        appState={mockAppState}
        testState="passed"
        isStudioActive={false}
      />,
    )

    cy.get('[data-cy="mounted-status"]').should('contain', 'mounted')
  })

  it('calls scrollIntoView when auto-scrolling is enabled and app is running', () => {
    const runningAppState = {
      ...mockAppState,
      isRunning: true,
      autoScrollingEnabled: true,
    } as unknown as AppState

    cy.mount(
      <TestComponent
        appState={runningAppState}
        testState="passed"
        isStudioActive={false}
      />,
    )

    // Wait for requestAnimationFrame to execute
    cy.wait(50)
    cy.get('@scrollIntoViewSpy').should('have.been.called')
  })

  it('calls scrollIntoView when auto-scrolling is enabled and studio is active', () => {
    const studioAppState = {
      ...mockAppState,
      autoScrollingEnabled: true,
    } as unknown as AppState

    cy.mount(
      <TestComponent
        appState={studioAppState}
        testState="passed"
        isStudioActive={true}
      />,
    )

    // Wait for requestAnimationFrame to execute
    cy.wait(50)
    cy.get('@scrollIntoViewSpy').should('have.been.called')
  })

  it('does not call scrollIntoView when auto-scrolling is disabled', () => {
    const disabledAppState = {
      ...mockAppState,
      autoScrollingEnabled: false,
    } as unknown as AppState

    cy.mount(
      <TestComponent
        appState={disabledAppState}
        testState="passed"
        isStudioActive={true}
      />,
    )

    // Wait for requestAnimationFrame to execute
    cy.wait(50)
    cy.get('@scrollIntoViewSpy').should('not.have.been.called')
  })

  it('does not call scrollIntoView when test state is processing', () => {
    const runningAppState = {
      ...mockAppState,
      isRunning: true,
      autoScrollingEnabled: true,
    } as unknown as AppState

    cy.mount(
      <TestComponent
        appState={runningAppState}
        testState="processing"
        isStudioActive={false}
      />,
    )

    // Wait for requestAnimationFrame to execute
    cy.wait(50)
    cy.get('@scrollIntoViewSpy').should('not.have.been.called')
  })

  it('does not call scrollIntoView when neither running nor studio active', () => {
    const inactiveAppState = {
      ...mockAppState,
      autoScrollingEnabled: true,
    } as unknown as AppState

    cy.mount(
      <TestComponent
        appState={inactiveAppState}
        testState="passed"
        isStudioActive={false}
      />,
    )

    // Wait for requestAnimationFrame to execute
    cy.wait(50)
    cy.get('@scrollIntoViewSpy').should('not.have.been.called')
  })

  it('calls scrollIntoView when scroll button is clicked and conditions are met', () => {
    const runningAppState = {
      ...mockAppState,
      isRunning: true,
      autoScrollingEnabled: true,
    } as unknown as AppState

    cy.mount(
      <TestComponent
        appState={runningAppState}
        testState="passed"
        isStudioActive={false}
      />,
    )

    // Clear the spy calls from the initial mount
    cy.get('@scrollIntoViewSpy').invoke('resetHistory')

    cy.get('[data-cy="scroll-button"]').click()
    cy.get('@scrollIntoViewSpy').should('have.been.called')
  })

  it('does not call scrollIntoView when scroll button is clicked but conditions are not met', () => {
    const inactiveAppState = {
      ...mockAppState,
      autoScrollingEnabled: false,
    } as unknown as AppState

    cy.mount(
      <TestComponent
        appState={inactiveAppState}
        testState="passed"
        isStudioActive={false}
      />,
    )

    // Clear the spy calls from the initial mount
    cy.get('@scrollIntoViewSpy').invoke('resetHistory')

    cy.get('[data-cy="scroll-button"]').click()
    cy.get('@scrollIntoViewSpy').should('not.have.been.called')
  })

  it('handles different test states correctly', () => {
    const runningAppState = {
      ...mockAppState,
      isRunning: true,
      autoScrollingEnabled: true,
    } as unknown as AppState
    const testStates = ['passed', 'failed', 'active', 'pending']

    testStates.forEach((state) => {
      if (state === 'processing') {
        // Skip processing state as it should not trigger scroll
        return
      }

      cy.mount(
        <TestComponent
          appState={runningAppState}
          testState={state}
          isStudioActive={false}
        />,
      )

      // Wait for requestAnimationFrame to execute
      cy.wait(50)
      cy.get('@scrollIntoViewSpy').should('have.been.called')
    })
  })

  it('provides containerRef that can be attached to DOM elements', () => {
    cy.mount(
      <TestComponent
        appState={mockAppState}
        testState="passed"
        isStudioActive={false}
      />,
    )

    cy.get('[data-cy="scroll-container"]').should('be.visible')
  })

  it('calls scrollIntoView with the correct element when conditions are met', () => {
    const runningAppState = {
      ...mockAppState,
      isRunning: true,
      autoScrollingEnabled: true,
    } as unknown as AppState

    cy.mount(
      <TestComponent
        appState={runningAppState}
        testState="passed"
        isStudioActive={false}
      />,
    )

    // Wait for requestAnimationFrame to execute
    cy.wait(50)
    cy.get('@scrollIntoViewSpy').should('have.been.called')

    // Verify it was called with the correct element
    cy.get('@scrollIntoViewSpy').its('args').then((args) => {
      expect(args[0][0]).to.have.attr('data-cy', 'scroll-container')
    })
  })

  it('handles undefined testState gracefully', () => {
    const runningAppState = {
      ...mockAppState,
      isRunning: true,
      autoScrollingEnabled: true,
    } as unknown as AppState

    cy.mount(
      <TestComponent
        appState={runningAppState}
        isStudioActive={false}
      />,
    )

    // Wait for requestAnimationFrame to execute
    cy.wait(50)
    cy.get('@scrollIntoViewSpy').should('have.been.called')
  })

  it('handles undefined isStudioActive gracefully', () => {
    const runningAppState = {
      ...mockAppState,
      isRunning: true,
      autoScrollingEnabled: true,
    } as unknown as AppState

    cy.mount(
      <TestComponent
        appState={runningAppState}
        testState="passed"
      />,
    )

    // Wait for requestAnimationFrame to execute
    cy.wait(50)
    cy.get('@scrollIntoViewSpy').should('have.been.called') // Should be called because isRunning is true
  })
})
