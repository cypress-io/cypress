/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Calendar from './Calendar'
import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'

describe('Calendar heatmap', () => {
  // Skipping the test because the tooltip does not get cleaned correctly
  // when the next test starts, see issue
  // https://github.com/bahmutov/cypress-react-unit-test/issues/206
  it.skip('random data', () => {
    // we cannot really screenshot random data for visual testing
    mount(<Calendar />)
    cy.get('.react-calendar-heatmap')

    cy.log('Check tooltip')
    // first there should be not toolip
    cy.get('[data-id=tooltip]').should('not.be.visible')

    // select a day using part of the attribute "data-tip"
    // full attribute: data-tip="2019-12-29 has count: 4"
    cy.get('[data-tip^="2019-12-29"]').click()
    cy.get('[data-id=tooltip]')
  })

  // stable but random sequence from
  // http://indiegamr.com/generate-repeatable-random-numbers-in-js/
  let seed = 6
  function seededRandom(max, min) {
    max = max || 1
    min = min || 0

    seed = (seed * 9301 + 49297) % 233280
    const rnd = seed / 233280

    return min + rnd * (max - min)
  }

  it('deterministic data', () => {
    // let's use heatmap with the data we control
    const startDate = new Date(2019, 10, 1) // year, month, day
    const endDate = new Date(2020, 3, 1)

    const values = Cypress._.range(1, 30).map(days => {
      return {
        date: new Date(2020, 0, days),
        count: Math.floor(seededRandom() * 4),
      }
    })

    const classForValue = value => {
      if (!value || !value.count) {
        return 'color-empty'
      }

      return `color-github-${value.count}`
    }

    mount(
      <>
        <h1>Stable random sequence</h1>
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={values}
          showWeekdayLabels={true}
          classForValue={classForValue}
        />
      </>,
    )

    // now we can do visual diffing
    cy.get('.react-calendar-heatmap').happoScreenshot({
      component: 'CalendarHeatmap',
    })
  })
})
