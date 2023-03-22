import { AppState } from '../lib/app-state'
import { StatsStore } from './stats-store'
import Header from './header'
import React from 'react'

describe('stats score header', () => {
  it('Shows stats with more than 4 digit test count nicely', () => {
    const appState = new AppState()
    const statsStore = new StatsStore()

    statsStore.start({ startTime: new Date().toISOString(), numPassed: 999999, numFailed: 999999, numPending: 999999 })
    statsStore.end()

    cy.mount(
      <Header statsStore={statsStore} appState={appState} runnablesStore={{} as any} />,
    )

    cy.percySnapshot()
  })
})
