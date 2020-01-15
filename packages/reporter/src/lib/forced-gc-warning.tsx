import { round } from 'lodash'
import React from 'react'

interface Props {
  show: boolean
}

class ForcedGcWarning extends React.Component<Props> {
  gcStartMs: number | null = null
  gcTotalMs: number = 0

  render () {
    const { show } = this.props

    if (!show) {
      if (this.gcStartMs) {
        const duration = Date.now() - this.gcStartMs

        this.gcStartMs = null
        this.gcTotalMs += duration
      }

      return null
    }

    if (show && !this.gcStartMs) {
      this.gcStartMs = Date.now()
    }

    return (
      <div className='forced-gc-warning'>
        <div>
          <strong>
            <i className='fas fa-exclamation-triangle'></i>{' '}
            Why are my tests freezing?
          </strong>
        </div>
        <div>
          Due to <a href='https://bugzilla.mozilla.org/show_bug.cgi?id=1608501' target='_blank' rel='noopener noreferrer'>Firefox bug #1608501</a>, Cypress must force the browser to run garbage collection routines between every test, which causes the UI to freeze. See <a href='https://github.com/cypress-io/cypress/issues/XXXX' target='_blank' rel='noopener noreferrer'>Cypress bug #XXXX</a> for details.
        </div>
        <span className='gc-timer'>Time spent in GC: {round(this.gcTotalMs / 1000, 2)}s</span>
      </div>
    )
  }
}

export default ForcedGcWarning
