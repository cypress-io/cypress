import cs from 'classnames'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'

import events from '../lib/events'
import { indent } from '../lib/util'
import runnablesStore from '../runnables/runnables-store'

import Attempts from '../attempts/attempts'

@observer
class Test extends Component {
  static defaultProps = {
    events,
    runnablesStore,
  }

  render () {
    const { model } = this.props

    if (!model.shouldRender) return null

    return (
      <div
        className={cs('runnable-wrapper', { 'is-open': model.isOpen })}
        onClick={model.toggleOpen}
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
      </div>
    )
  }

  _contents () {
    // performance optimization - don't render contents if not open
    if (!this.props.model.isOpen) return null

    return (
      <div
        className='runnable-instruments collapsible-content'
        onClick={(e) => e.stopPropagation()}
      >
        <Attempts test={this.props.model} />
      </div>
    )
  }

  _onErrorClick = (e) => {
    e.stopPropagation()
    this.props.events.emit('show:error', this.props.model.id)
  }
}

export default Test
