import React from 'react'
import { StudioTest } from './StudioTest'
import { AppState } from '../lib/app-state'
import { RunnablesStore } from '../runnables/runnables-store'
import { StatsStore } from '../header/stats-store'
import Test from '../test/test-model'
import scroller from '../lib/scroller'

describe('StudioTest', () => {
  let appState: AppState
  let runnablesStore: RunnablesStore
  let statsStore: StatsStore
  let mockTest: Test

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

    // Mock the test with proper type casting
    mockTest = {
      id: 'test-1',
      title: 'should display correct content',
      state: 'passed',
      parentTitle: 'Example Test Suite > Nested Suite',
      attempts: [
        {
          id: 'attempt-1',
          state: 'passed',
          hooks: [
            {
              id: 'hook-1',
              type: 'hook',
              name: 'test body',
              hookName: 'test body',
              state: 'passed',
              duration: 1000,
              commands: [
                {
                  id: 'command-1',
                  type: 'command',
                  name: 'command-1',
                  state: 'passed',
                  duration: 1000,
                  _isPending: () => false,
                  renderProps: {},
                  displayMessage: null,
                },
              ],
            },
          ],
          hookCount: {
            'before all': 0,
            'before each': 0,
            'after all': 0,
            'after each': 0,
            'test body': 1,
          },
          hasCommands: true,
          isOpen: true,
          sessions: [],
          agents: [],
          routes: [],
        },
      ],
      callbackAfterUpdate: cy.stub().as('callbackAfterUpdate'),
    } as unknown as Test

    // Mock stores with proper type casting
    appState = {
      isRunning: false,
      isPaused: false,
      autoScrollingEnabled: true,
      scrollTop: 0,
      user: null,
      preferences: {},
      studioActive: true,
    } as unknown as AppState

    runnablesStore = {
      isReady: true,
      _tests: {
        'test-1': mockTest,
      },
    } as unknown as RunnablesStore

    statsStore = {
      duration: 1500,
    } as unknown as StatsStore
  })

  it('renders component with test information', () => {
    cy.mount(
      <StudioTest
        appState={appState}
        runnablesStore={runnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('.studio-single-test-container').should('be.visible')
    cy.get('.studio-header__test-section').should('be.visible')
    cy.get('.studio-single-test-attempts').should('be.visible')
    cy.get('.attempts.single-studio-test').should('have.css', 'border-bottom-style', 'none').and('have.css', 'border-right-style', 'none')
    cy.get('[data-cy="studio-single-test-title"]').should('contain.text', 'should display correct content')
    cy.get('[data-cy="spec-duration"]').should('contain', '00:02')
    cy.percySnapshot()
  })

  it('renders long test title', () => {
    const longTest = { ...mockTest, title: 'displays correct content where test title is very long and exceeds the normal length but the alignment in the header is correct' } as unknown as Test
    const testRunnablesStore = { ...runnablesStore, _tests: { 'test-1': longTest } } as unknown as RunnablesStore

    cy.mount(
      <StudioTest
        appState={appState}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('.studio-single-test-container').should('be.visible')
    cy.get('.studio-header__test-section').should('be.visible')
    cy.get('.studio-single-test-attempts').should('be.visible')
    cy.get('[data-cy="studio-single-test-title"]').should('contain.text', 'is very long')
    cy.get('[data-cy="spec-duration"]').should('contain', '00:02')
    cy.percySnapshot()
  })

  it('shows correct status icon for passed test', () => {
    const passedTest = { ...mockTest, state: 'passed' } as unknown as Test
    const testRunnablesStore = { ...runnablesStore, _tests: { 'test-1': passedTest } } as unknown as RunnablesStore

    cy.mount(
      <StudioTest
        appState={appState}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="passed-icon"]').should('exist')
  })

  it('shows correct status icon for failed test', () => {
    const failedTest = { ...mockTest, state: 'failed' } as unknown as Test
    const testRunnablesStore = { ...runnablesStore, _tests: { 'test-1': failedTest } } as unknown as RunnablesStore

    cy.mount(
      <StudioTest
        appState={appState}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="failed-icon"]').should('exist')
  })

  it('shows correct status icon for running test', () => {
    const runningTest = { ...mockTest, state: 'active' } as unknown as Test
    const testRunnablesStore = { ...runnablesStore, _tests: { 'test-1': runningTest } } as unknown as RunnablesStore

    cy.mount(
      <StudioTest
        appState={appState}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="running-icon"]').should('exist')
  })

  it('shows correct status icon for queued test', () => {
    const queuedTest = { ...mockTest, state: 'processing' } as unknown as Test
    const testRunnablesStore = { ...runnablesStore, _tests: { 'test-1': queuedTest } } as unknown as RunnablesStore

    cy.mount(
      <StudioTest
        appState={appState}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="queued-icon"]').should('exist')
  })

  it('shows tooltip with parent titles', () => {
    const testWithParents = { ...mockTest, parentTitle: 'Test Suite > Nested Suite' } as unknown as Test
    const testRunnablesStore = { ...runnablesStore, _tests: { 'test-1': testWithParents } } as unknown as RunnablesStore

    cy.mount(
      <StudioTest
        appState={appState}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="studio-single-test-title"]').realHover()
    cy.get('.studio-tooltip__breadcrumb-list').should('be.visible')
    cy.get('.studio-tooltip__breadcrumb-item').should('have.length', 2)
    cy.get('.studio-tooltip__breadcrumb-item').first().should('contain', 'Test Suite')
    cy.get('.studio-tooltip__breadcrumb-item').last().should('contain', 'Nested Suite')
  })

  it('shows tooltip with very long nested titles', () => {
    const testWithLongTitles = {
      ...mockTest,
      parentTitle: 'Very Long Suite Name That Exceeds Normal Length > Another Extremely Long Suite Name That Goes On And On > Third Level With Ridiculously Long Name > Fourth Level With Even More Text > Fifth Level With Maximum Length > Sixth Level With Overflow > Seventh Level With Truncation > Eighth Level With Wrapping > Ninth Level With Scrolling > Tenth Level With Final Test',
    } as unknown as Test
    const testRunnablesStore = { ...runnablesStore, _tests: { 'test-1': testWithLongTitles } } as unknown as RunnablesStore

    cy.mount(
      <StudioTest
        appState={appState}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="studio-single-test-title"]').realHover()
    cy.get('.studio-tooltip__breadcrumb-list').should('be.visible')
    cy.get('.studio-tooltip__breadcrumb-item').should('have.length', 10)
    cy.percySnapshot()
  })

  it('displays test title without tooltip when no parent titles', () => {
    const testWithoutParent = { ...mockTest, parentTitle: undefined } as unknown as Test
    const testRunnablesStore = { ...runnablesStore, _tests: { 'test-1': testWithoutParent } } as unknown as RunnablesStore

    cy.mount(
      <StudioTest
        appState={appState}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="studio-single-test-title"]').should('be.visible')
    cy.get('.studio-header__test-tooltip-wrapper').should('not.exist')
  })

  it('displays test title without tooltip when parent title is empty', () => {
    const testWithEmptyParent = { ...mockTest, parentTitle: '' } as unknown as Test
    const testRunnablesStore = { ...runnablesStore, _tests: { 'test-1': testWithEmptyParent } } as unknown as RunnablesStore

    cy.mount(
      <StudioTest
        appState={appState}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="studio-single-test-title"]').should('be.visible')
    cy.get('.studio-header__test-tooltip-wrapper').should('not.exist')
  })

  it('calls callbackAfterUpdate when mounted', () => {
    cy.mount(
      <StudioTest
        appState={appState}
        runnablesStore={runnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('@callbackAfterUpdate').should('have.been.called')
  })

  it('handles missing test gracefully', () => {
    const emptyRunnablesStore = { ...runnablesStore, _tests: {} } as unknown as RunnablesStore

    cy.mount(
      <StudioTest
        appState={appState}
        runnablesStore={emptyRunnablesStore}
        statsStore={statsStore}
      />,
    )

    // Should not render anything when no test is available
    cy.get('.studio-single-test-container').should('not.exist')
  })
})
