import cs from 'classnames'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'

import appState from '../lib/app-state'
import events from '../lib/events'
import { indent } from '../lib/util'
import runnablesStore from '../runnables/runnables-store'
import scroller from '../lib/scroller'

import Hooks from '../hooks/hooks'
import Agents from '../agents/agents'
import Routes from '../routes/routes'
import FlashOnClick from '../lib/flash-on-click'

const NoCommands = observer(() => (
  <ul className='hooks-container'>
    <li className='no-commands'>
      No commands were issued in this test.
    </li>
  </ul>
))

@observer
class Test extends Component {
  static defaultProps = {
    appState,
    events,
    runnablesStore,
    scroller,
  }

  @observable isOpen = null

  componentDidMount () {
    this._scrollIntoView()
  }

  componentDidUpdate () {
    this._scrollIntoView()

    const cb = this.props.model.callbackAfterUpdate

    if (cb) {
      cb()
    }
  }

  _scrollIntoView () {
    const { appState, model, scroller } = this.props
    const { isActive, shouldRender } = model

    if (appState.autoScrollingEnabled && appState.isRunning && shouldRender && isActive != null) {
      scroller.scrollIntoView(this.refs.container)
    }
  }

  render () {
    const { model } = this.props

    if (!model.shouldRender) return null

    return (
      <div
        ref='container'
        className={cs('runnable-wrapper', { 'is-open': this._shouldBeOpen() })}
        onClick={this._toggleOpen}
        style={{ paddingLeft: indent(model.level) }}
      >
        <div className='runnable-content-region'>
          <i className='runnable-state fa'></i>
          <span className='runnable-title'>{model.title}</span>
          <div className='runnable-controls'>
            <Tooltip placement='top' title='One or more commands failed'>
              <i className='fa fa-warning'></i>
            </Tooltip>
          </div>
        </div>
        {this._contents()}
        <FlashOnClick
          message='Printed output to your console'
          onClick={this._onErrorClick}
        >
          <pre className='test-error'>{model.err.displayMessage}</pre>
        </FlashOnClick>
      </div>
    )
  }

  _contents () {
    // performance optimization - don't render contents if not open
    if (!this._shouldBeOpen()) return null

    const { model } = this.props

    return (
      <div
        className='runnable-instruments collapsible-content'
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <Agents model={model} />
        <Routes model={model} />
        <div className='runnable-commands-region'>
          {model.commands.length ? <Hooks model={model} /> : <NoCommands />}
        </div>
      </div>
    )
  }

  _shouldBeOpen () {
    // if this.isOpen is non-null, prefer that since the user has
    // explicity chosen to open or close the test
    if (this.isOpen !== null) return this.isOpen

    // otherwise, look at reasons to auto-open the test
    return this.props.model.state === 'failed'
           || this.props.model.isOpen
           || this.props.model.isLongRunning
           || this.props.runnablesStore.hasSingleTest
  }

  @action _toggleOpen = () => {
    if (this.isOpen === null) {
      this.isOpen = !this._shouldBeOpen()
    } else {
      this.isOpen = !this.isOpen
    }
  }

  _onErrorClick = (e) => {
    e.stopPropagation()
    this.props.events.emit('show:error', this.props.model.id)
  }
}

export { NoCommands }

export default Test
