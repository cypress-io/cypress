import { isUndefined, round } from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import { AppState } from './app-state'
import { Events } from './events'

export interface Props {
  appState: Pick<AppState, 'forcingGc' | 'firefoxGcInterval'>
  events: Events
}

interface State {
  expanded: boolean
}

@observer
class ForcedGcWarning extends React.Component<Props> {
  gcStartMs: number | null = null
  gcTotalMs: number = 0
  persisted = false
  state: State

  constructor (props: Props) {
    super(props)
    this.state = {
      expanded: false,
    }
  }

  _toggleExpando () {
    this.setState({ expanded: !this.state.expanded })
  }

  _updateGcTimer () {
    const { forcingGc } = this.props.appState

    if (!forcingGc) {
      if (this.gcStartMs) {
        const duration = Date.now() - this.gcStartMs

        this.gcStartMs = null
        this.gcTotalMs += duration
      }
    }

    if (forcingGc && !this.gcStartMs) {
      this.gcStartMs = Date.now()
    }
  }

  _renderDisabled () {
    return (
      <div className='forced-gc-warning'>
        <div className={`gc-expando ${this.state.expanded ? 'expanded' : ''}`}>
          <p>
            <strong>
              <i className='fas fa-trash-alt'></i>{' '}
              Garbage Collection Interval: (disabled)
            </strong>
            <i className='fas fa-times clickable' onClick={() => this._toggleExpando()}></i>
          </p>
          <div>
            <p>
              Cypress can force Firefox to run Garbage Collection (GC) between tests by enabling: <a onClick={this._handleLink} href='https://on.cypress.io/firefox-gc-issue'><code>firefoxGcInterval</code></a>
            </p>
            <p>
              By default, <a onClick={this._handleLink} href='https://on.cypress.io/firefox-gc-issue'><code>firefoxGcInterval</code></a> is only enabled in  <strong>run mode</strong>.
            </p>
            <p>
              Running GC prevents Firefox from running out of memory during longer test runs.
            </p>
            <p>
              Read <a onClick={this._handleLink} href='https://on.cypress.io/firefox-gc-issue'>issue #6187</a> for more details.
            </p>
          </div>
        </div>
        <div className='gc-status-bar clickable gc-not-running' onClick={() => this._toggleExpando()}>
          <span className='total-time'>
            <i className='fas fa-ws fa-info-circle'></i>
            GC Interval: <span className='gc-status'>disabled</span>
          </span>
        </div>
      </div>
    )
  }

  _handleLink = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (!e.currentTarget || !e.currentTarget.href) {
      return
    }

    e.preventDefault()
    this.props.events.emit('external:open', e.currentTarget.href)
  }

  _renderForcedGcWarning () {
    const { forcingGc } = this.props.appState

    return (
      <div className='forced-gc-warning'>
        <div className={`gc-expando ${this.state.expanded ? 'expanded' : ''}`}>
          <div>
            <p>
              <strong>
                <i className='fas fa-trash-alt'></i>{' '}
                Garbage Collection Interval: (enabled)
              </strong>
              <i className='fas fa-times clickable' onClick={() => this._toggleExpando()}></i>
            </p>
          </div>
          <div>
            <p>
              Cypress will force Firefox to run Garbage Collection (GC) between tests based on the value of: <a onClick={this._handleLink} href='https://on.cypress.io/firefox-gc-issue'><code>firefoxGcInterval</code></a>
            </p>
            <p>
              Running GC prevents Firefox from running out of memory during longer test runs.
            </p>
            <p>
              Running GC is an expensive operation that can take up to a few seconds to complete. During this time Firefox may "freeze" and become unresponsive to user input.
            </p>
            <p>
              To improve performance, you can try setting <a onClick={this._handleLink} href='https://on.cypress.io/firefox-gc-issue'><code>firefoxGcInterval</code></a> to a higher value, which will result in running GC less frequently.
            </p>
            <p>
              Read <a onClick={this._handleLink} href='https://on.cypress.io/firefox-gc-issue'>issue #6187</a> for more details.
            </p>
          </div>
        </div>
        <div className={`gc-status-bar clickable ${forcingGc ? 'gc-running' : 'gc-not-running'}`} onClick={() => this._toggleExpando()}>
          <span className='total-time' title='Total time spent running GC throughout this run'>
            <i className='fas fa-ws fa-info-circle'></i>
            GC Duration: <span className='gc-status'>{round(this.gcTotalMs / 1000, 2).toFixed(2)}</span>
          </span>

          {forcingGc && <span className='status-text'>
            <i className='fas fa-spinner fa-spin'></i> Running GC...
          </span>}
        </div>
      </div>
    )
  }

  render () {
    const { firefoxGcInterval } = this.props.appState

    if (isUndefined(firefoxGcInterval)) {
      // we're either still loading or it is disabled
      return null
    }

    if (firefoxGcInterval === 0 || firefoxGcInterval == null) {
      return this._renderDisabled()
    }

    this._updateGcTimer()

    return this._renderForcedGcWarning()
  }
}

export default ForcedGcWarning
