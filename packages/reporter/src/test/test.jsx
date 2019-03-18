import cs from 'classnames'
import { action, computed, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'

import events from '../lib/events'
import { indent } from '../lib/util'
import runnablesStore from '../runnables/runnables-store'

import Attempts from '../attempts/attempts'
import FlashOnClick from '../lib/flash-on-click'

@observer
class Test extends Component {
  static defaultProps = {
    events,
    runnablesStore,
  }

  @observable isOpen = null

  @computed get _shouldBeOpen () {
    // if this.isOpen is non-null, prefer that since the user has
    // explicity chosen to open or close the test
    if (this.isOpen !== null) return this.isOpen

    const { model, runnablesStore } = this.props

    // otherwise, look at reasons to auto-open the test
    return model.state === 'failed'
           || model.isOpen
           || model.isLongRunning
           || runnablesStore.hasSingleTest
  }

  render () {
    const { model } = this.props

    if (!model.shouldRender) return null

    return (
      <div
        className={cs('runnable-wrapper', { 'is-open': this._shouldBeOpen })}
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
    if (!this._shouldBeOpen) return null

    return (
      <div
        className='runnable-instruments collapsible-content'
        onClick={(e) => e.stopPropagation()}
      >
        <Attempts test={this.props.model} />
      </div>
    )
  }

  @action _toggleOpen = () => {
    if (this.isOpen === null) {
      this.isOpen = !this._shouldBeOpen
    } else {
      this.isOpen = !this.isOpen
    }
  }

  _onErrorClick = (e) => {
    e.stopPropagation()
    this.props.events.emit('show:error', this.props.model.id)
  }
}

export default Test
