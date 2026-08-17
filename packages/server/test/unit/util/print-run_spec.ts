import '../../spec_helper'

import snapshot from 'snap-shot-it'
import widestLine from 'widest-line'
import { stripVTControlCharacters as stripAnsi } from 'util'
import * as printRun from '../../../lib/util/print-run'

const attempts = (...states: string[]) => states.map((state) => ({ state }))

const makeRun = (name: string, tests: { state: string, attempts: { state: string }[] }[], overrides: object = {}) => {
  return {
    spec: { name, relativeToCommonRoot: `cypress/e2e/${name}` },
    stats: {
      tests: tests.length,
      passes: tests.filter((t) => t.state === 'passed').length,
      failures: tests.filter((t) => t.state === 'failed').length,
      pending: 0,
      skipped: 0,
      wallClockDuration: 1234,
    },
    tests,
    screenshots: [],
    video: null,
    ...overrides,
  }
}

const makeResults = (runs: any[]) => {
  return {
    runs,
    totalDuration: 4321,
    totalTests: runs.reduce((memo, run) => memo + run.stats.tests, 0),
    totalPassed: runs.reduce((memo, run) => memo + run.stats.passes, 0),
    totalFailed: runs.reduce((memo, run) => memo + run.stats.failures, 0),
    totalPending: 0,
    totalSkipped: 0,
  } as any
}

const passing = makeRun('passing.cy.js', [
  { state: 'passed', attempts: attempts('passed') },
])

// retried until it passed - `detect-flake-and-pass-on-threshold`
const flakyPassing = makeRun('flaky-passing.cy.js', [
  { state: 'passed', attempts: attempts('failed', 'passed') },
  { state: 'passed', attempts: attempts('passed') },
])

// passed an attempt but was still failed - `detect-flake-but-always-fail`
const flakyFailing = makeRun('flaky-failing.cy.js', [
  { state: 'failed', attempts: attempts('failed', 'passed') },
])

describe('lib/util/print-run', () => {
  let logs: string[]

  beforeEach(() => {
    logs = []
    sinon.stub(console, 'log').callsFake((...args: any[]) => {
      logs.push(args.join(' '))
    })
  })

  const output = () => stripAnsi(logs.join('\n'))

  const expectTableWidth = (str: string) => {
    const summaryTable = str.split('\n').find((line) => line.includes('Spec'))

    expect(widestLine(summaryTable as string)).to.eq(100)
  }

  context('.renderSummaryTable', () => {
    it('omits the flaky column when no test was flaky', () => {
      printRun.renderSummaryTable(undefined, makeResults([passing]))

      expect(output()).not.to.include('Flaky')
      expectTableWidth(output())
      snapshot(output())
    })

    it('counts tests that passed after failing', () => {
      printRun.renderSummaryTable(undefined, makeResults([flakyPassing, passing]))

      expectTableWidth(output())
      snapshot(output())
    })

    it('counts tests that failed after passing', () => {
      printRun.renderSummaryTable(undefined, makeResults([flakyFailing]))

      expectTableWidth(output())
      snapshot(output())
    })

    it('renders a dash for specs skipped by the cloud', () => {
      const skipped = makeRun('skipped.cy.js', [], { skippedSpec: true })

      printRun.renderSummaryTable(undefined, makeResults([flakyPassing, skipped]))

      expectTableWidth(output())
      snapshot(output())
    })
  })

  context('.displayResults', () => {
    it('omits the flaky row when no test was flaky', () => {
      printRun.displayResults(passing as any, 0)

      expect(output()).not.to.include('Flaky')
      snapshot(output())
    })

    it('includes the flaky row when a test was flaky', () => {
      printRun.displayResults(flakyPassing as any, 0)

      snapshot(output())
    })
  })
})
