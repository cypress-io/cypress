import React from 'react'
import { StudioSingleTest, SingleTestActions } from './StudioSingleTest'
import { AppState } from '../lib/app-state'
import { RunnablesStore } from '../runnables/runnables-store'
import { StatsStore } from '../header/stats-store'
import Test from '../test/test-model'

describe('StudioSingleTest', () => {
  let appState: AppState
  let runnablesStore: RunnablesStore
  let statsStore: StatsStore
  let mockSpec: Cypress.Cypress['spec']
  let mockTest: Test
  let defaultRunnablesStore: RunnablesStore

  beforeEach(() => {
    // Mock the spec
    mockSpec = {
      name: 'cypress/e2e/example.cy.ts',
      relative: 'cypress/e2e/example.cy.ts',
      absolute: '/Users/test/cypress/e2e/example.cy.ts',
    } as Cypress.Cypress['spec']

    // Mock the test with proper type casting
    mockTest = {
      id: 'test-1',
      title: 'should display correct content',
      state: 'passed',
      parentTitle: 'Example Test Suite > Nested Suite',
      attempts: [],
    } as unknown as Test

    // Mock stores with proper type casting
    appState = {
      isRunning: false,
      isPaused: false,
      autoScrollingEnabled: true,
      scrollTop: 0,
      user: null,
      preferences: {},
    } as unknown as AppState

    defaultRunnablesStore = {
      isReady: true,
    } as unknown as RunnablesStore

    runnablesStore = {
      ...defaultRunnablesStore,
      _tests: {
        'test-1': mockTest,
      },
    } as unknown as RunnablesStore

    statsStore = {
      duration: 1500,
    } as unknown as StatsStore

    cy.stub(SingleTestActions, 'handleBackButton').as('handleBackButton')
  })

  it('renders component', () => {
    cy.mount(
      <StudioSingleTest
        appState={appState}
        spec={mockSpec}
        runnablesStore={runnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="studio-back-button"]').should('be.visible')
    cy.get('[data-cy="studio-single-test-file-name"]').should('contain', 'example.cy.ts')
    cy.get('.studio-header__file-content').should('be.visible')
    cy.get('[data-cy="studio-single-test-title"]').should('contain', mockTest.title)
    cy.get('.studio-header__test-section').should('be.visible')
    cy.get('[data-cy="spec-duration"]').should('contain', '00:02')
    cy.percySnapshot()
  })

  it('shows correct status icon for passed test', () => {
    const passedTest = { ...mockTest, state: 'passed' } as unknown as Test
    const testRunnablesStore = { ...defaultRunnablesStore, _tests: { 'test-1': passedTest } } as unknown as RunnablesStore

    cy.mount(
      <StudioSingleTest
        appState={appState}
        spec={mockSpec}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    // Check for passed status icon
    cy.get('[data-cy="passed-icon"]').should('exist')
  })

  it('shows correct status icon for failed test', () => {
    const failedTest = { ...mockTest, state: 'failed' } as unknown as Test
    const testRunnablesStore = { ...defaultRunnablesStore, _tests: { 'test-1': failedTest } } as unknown as RunnablesStore

    cy.mount(
      <StudioSingleTest
        appState={appState}
        spec={mockSpec}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    // Check for failed status icon
    cy.get('[data-cy="failed-icon"]').should('exist')
  })

  it('shows correct status icon for running test', () => {
    const runningTest = { ...mockTest, state: 'active' } as unknown as Test
    const testRunnablesStore = { ...defaultRunnablesStore, _tests: { 'test-1': runningTest } } as unknown as RunnablesStore

    cy.mount(
      <StudioSingleTest
        appState={appState}
        spec={mockSpec}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    // Check for running status icon
    cy.get('[data-cy="running-icon"]').should('exist')
  })

  it('shows correct status icon for queued test', () => {
    const queuedTest = { ...mockTest, state: 'processing' } as unknown as Test
    const testRunnablesStore = { ...defaultRunnablesStore, _tests: { 'test-1': queuedTest } } as unknown as RunnablesStore

    cy.mount(
      <StudioSingleTest
        appState={appState}
        spec={mockSpec}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    // Check for queued status icon
    cy.get('[data-cy="queued-icon"]').should('exist')
  })

  it('shows tooltip with parent titles', () => {
    const testWithParents = { ...mockTest, parentTitle: 'Test Suite > Nested Suite' } as unknown as Test
    const testRunnablesStore = { ...defaultRunnablesStore, _tests: { 'test-1': testWithParents } } as unknown as RunnablesStore

    cy.mount(
      <StudioSingleTest
        appState={appState}
        spec={mockSpec}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="studio-single-test-title"]').contains(`${mockTest.title}`).realHover()
    cy.get('.studio-tooltip__breadcrumb-list').should('be.visible')
    cy.get('.studio-tooltip__breadcrumb-item').should('have.length', 2)
    cy.get('.studio-tooltip__breadcrumb-item').first().should('contain', 'Test Suite')
    cy.get('.studio-tooltip__breadcrumb-item').last().should('contain', 'Nested Suite')
  })

  it('shows tooltip with parent titles very long nested titles', () => {
    const testWithLongTitles = {
      ...mockTest,
      parentTitle: 'Very Long Suite Name That Exceeds Normal Length > Another Extremely Long Suite Name That Goes On And On > Third Level With Ridiculously Long Name > Fourth Level With Even More Text > Fifth Level With Maximum Length > Sixth Level With Overflow > Seventh Level With Truncation > Eighth Level With Wrapping > Ninth Level With Scrolling > Tenth Level With Final Test',
    } as unknown as Test
    const testRunnablesStore = { ...defaultRunnablesStore, _tests: { 'test-1': testWithLongTitles } } as unknown as RunnablesStore

    cy.mount(
      <StudioSingleTest
        appState={appState}
        spec={mockSpec}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="studio-single-test-title"]').realHover()
    cy.get('.studio-tooltip__breadcrumb-list').should('be.visible')
    cy.get('.studio-tooltip__breadcrumb-item').should('have.length', 10)
    cy.percySnapshot()
  })

  it('handles back button', () => {
    cy.mount(
      <StudioSingleTest
        appState={appState}
        spec={mockSpec}
        runnablesStore={runnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="studio-back-button"]').click()
    cy.get('@handleBackButton').should('have.been.called')
  })

  it('handles test without parent titles', () => {
    const testWithoutParents = { ...mockTest, parentTitle: undefined } as unknown as Test
    const testRunnablesStore = { ...defaultRunnablesStore, _tests: { 'test-1': testWithoutParents } } as unknown as RunnablesStore

    cy.mount(
      <StudioSingleTest
        appState={appState}
        spec={mockSpec}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="studio-single-test-title"]').contains(`${mockTest.title}`).realHover()
    cy.get('.studio-tooltip__breadcrumb-list').should('not.exist')
  })

  it('handles empty parent titles array', () => {
    const testWithEmptyParents = { ...mockTest, parentTitle: '' } as unknown as Test
    const testRunnablesStore = { ...defaultRunnablesStore, _tests: { 'test-1': testWithEmptyParents } } as unknown as RunnablesStore

    cy.mount(
      <StudioSingleTest
        appState={appState}
        spec={mockSpec}
        runnablesStore={testRunnablesStore}
        statsStore={statsStore}
      />,
    )

    cy.get('[data-cy="studio-single-test-title"]').contains(`${mockTest.title}`).realHover()
    cy.get('.studio-tooltip__breadcrumb-list').should('not.exist')
  })

  it('handles missing test gracefully', () => {
    const emptyRunnablesStore = { ...defaultRunnablesStore, _tests: {} } as unknown as RunnablesStore

    cy.mount(
      <StudioSingleTest
        appState={appState}
        spec={mockSpec}
        runnablesStore={emptyRunnablesStore}
        statsStore={statsStore}
      />,
    )

    // Should still render header but not test section
    cy.get('.studio-header__file-section').should('be.visible')
    cy.get('.studio-header__test-section').should('not.exist')
  })

  it('shows loading state when not ready', () => {
    const notReadyRunnablesStore = {
      ...runnablesStore,
      isReady: false,
    } as unknown as RunnablesStore

    cy.mount(
      <StudioSingleTest
        appState={appState}
        spec={mockSpec}
        runnablesStore={notReadyRunnablesStore}
        statsStore={statsStore}
      />,
    )

    // Should show loading component and not render the main content
    cy.contains('Your tests are loading...').should('be.visible')
    cy.get('.studio-header__file-section').should('not.exist')
    cy.get('.studio-header__test-section').should('not.exist')
  })
})
