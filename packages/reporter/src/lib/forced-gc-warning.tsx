import { isUndefined, round } from 'lodash'
import React from 'react'
import { Events } from './events'
import { AppState } from './app-state'
import { observer } from 'mobx-react'

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
          <div>
            <strong>
              <i className='fas fa-info-circle'></i>{' '}
              What is this?
            </strong>
            <i className='fas fa-times clickable' onClick={() => this._toggleExpando()}></i>
          </div>
          <div>
            To prevent a bug in Firefox from causing it to use up all available RAM, Cypress can force garbage collection (GC) between tests. This is enabled in <code>run</code> mode and disabled in <code>open</code> mode by default. See <a onClick={(e) => this._handleLink(e)} href='https://on.cypress.io/firefox-gc-issue'>issue #6187</a> for details.
          </div>
        </div>
        <div className='gc-status-bar clickable gc-not-running' onClick={() => this._toggleExpando()}>
          <span className='total-time'>
            <i className='fas fa-ws fa-info-circle'></i>
            Forced GC is disabled.
          </span>
        </div>
      </div>
    )
  }

  _handleLink (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
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
            <strong>
              <i className='fas fa-exclamation-triangle'></i>{' '}
              Why is Cypress freezing between tests?
            </strong>
            <i className='fas fa-times clickable' onClick={() => this._toggleExpando()}></i>
          </div>
          <div>
            To prevent a bug in Firefox from causing it to use up all available RAM, Cypress forces the browser to run garbage collection (GC) routines between tests, which causes the UI to freeze. See <a onClick={(e) => this._handleLink(e)} href='https://on.cypress.io/firefox-gc-issue'>issue #6187</a> for details.
          </div>
        </div>
        <div className={`gc-status-bar clickable ${forcingGc ? 'gc-running' : 'gc-not-running'}`} onClick={() => this._toggleExpando()}>
          <span className='total-time' title='Total time spent in forced GC during this session'>
            <i className='fas fa-ws fa-info-circle'></i>
            GC Duration: {round(this.gcTotalMs / 1000, 2)}
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
