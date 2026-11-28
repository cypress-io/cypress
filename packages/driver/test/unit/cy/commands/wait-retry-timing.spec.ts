import { describe, it, expect } from 'vitest'
import _ from 'lodash'

const wouldTimeoutOnNextRetry = (options: {
  _start?: Date
  _runnableTimeout: number
}, interval = 16) => {
  const total = options._start
    ? Date.now() - options._start.valueOf()
    : 0

  return (total + interval) >= options._runnableTimeout
}

describe('cy.wait retry timing between request and response phases', () => {
  it('does not carry request-phase retry elapsed time into the response phase', () => {
    const optionsAfterRequestPhase = {
      _start: new Date(Date.now() - 290),
      _retries: 10,
      _runnableTimeout: 5000,
      timeout: 5000,
      responseTimeout: 299,
    }

    expect(wouldTimeoutOnNextRetry({
      _start: optionsAfterRequestPhase._start,
      _runnableTimeout: optionsAfterRequestPhase.responseTimeout,
    })).toBe(true)

    const responsePhaseOptions = _.omit(
      optionsAfterRequestPhase,
      '_runnableTimeout',
      '_start',
      '_retries',
    )

    responsePhaseOptions.timeout = optionsAfterRequestPhase.responseTimeout

    expect(responsePhaseOptions._start).toBeUndefined()
    expect(wouldTimeoutOnNextRetry({
      _runnableTimeout: responsePhaseOptions.timeout,
    })).toBe(false)
  })
})
