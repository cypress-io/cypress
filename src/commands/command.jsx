import _ from 'lodash'
import cs from 'classnames'
import Markdown from 'markdown-it'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import events from '../lib/events'
import Tooltip from '../lib/tooltip'
import FlashOnClick from '../lib/flash-on-click'
import runnablesStore from '../runnables/runnables-store'

const LONG_RUNNING_THRESHOLD = 500
const md = new Markdown()

// TODO: move to command model?
const displayName = (model) => model.displayName || model.name
const nameClassName = (name) => name.replace(/(\s+)/g, '-')
const truncatedMessage = (message) => _.truncate(message, { length: 100 })
const formattedMessage = (message) => message ? md.renderInline(message) : ''
const visibleMessage = (model) => {
  if (model.visible) return ''

  return model.numElements > 1 ?
    'One or more matched elements are not visible.' :
    'This element is not visible.'
}

const Aliases = observer(({ model }) => (
  <span>
    {_.map([].concat(model.referencesAlias), (alias) => (
      <Tooltip key={alias} placement='top' title={`Found an alias for: '${alias}'`}>
        <span className={`command-alias ${model.aliasType}`}>@{alias}</span>
      </Tooltip>
    ))}
  </span>
))

const Message = observer(({ model }) => (
  <span>
    <i className={`fa fa-circle ${model.renderProps.indicator}`}></i>
    <span className='command-message-text' dangerouslySetInnerHTML={{ __html: formattedMessage(model.renderProps.message || truncatedMessage(model.message)) }} />
  </span>
))

@observer
class Command extends Component {
  render () {
    const { model } = this.props

    return (
      <li
        className={cs(
          `command-name-${nameClassName(model.name)}`,
          `command-state-${model.state}`,
          `command-type-${model.type}`,
          {
            'command-is-event': !!model.event,
            'command-is-invisible': model.visible != null && !model.visible,
            'command-has-num-elements': model.numElements != null,
            'command-has-no-elements': !model.numElements,
            'command-has-multiple-elements': model.numElements > 1,
            'command-with-indicator': !!model.renderProps.indicator,
            'command-scaled': model.renderProps.message && model.renderProps.message.length > 100,
          }
        )}
      >
        <FlashOnClick
          message='Printed output to your console!'
          onClick={() => events.emit('show:command', model.id)}
        >
          <div
            className='command-wrapper'
            onMouseOver={() => this._snapshot(true)}
            onMouseOut={() => this._snapshot(false)}
          >
            <span className='command-number'>
              <i className='fa fa-spinner fa-spin'></i>
              <span>{model.number || ''}</span>
            </span>
            <span className='command-method'>
              <span>{model.event ? `(${displayName(model)})` :  displayName(model)}</span>
            </span>
            <span className='command-message'>
              {model.referencesAlias ? <Aliases model={model} /> : <Message model={model} />}
            </span>
            <span className='command-controls'>
              <Tooltip placement='left' title={`${model.message} aliased as: '${model.alias}'`}>
                <span className={`command-alias ${model.aliasType}`}>{model.alias}</span>
              </Tooltip>
              <Tooltip placement='left' title={visibleMessage(model)}>
                <i className='command-invisible fa fa-eye-slash'></i>
              </Tooltip>
              <Tooltip placement='left' title={`${model.numElements} matched elements`}>
                <span className='command-num-elements'>{model.numElements}</span>
              </Tooltip>
            </span>
          </div>
        </FlashOnClick>
      </li>
    )
  }

  // snapshot rules
  //
  // 1. when we hover over a command, wait 50 ms
  // if we're still hovering, send show:snapshot
  //
  // 2. when we hover off a command, wait 50 ms
  // and if we are still in a non-showing state
  // meaning we have moused over nothing instead
  // of a different command, send hide:snapshot
  //
  // this prevents heavy CPU usage when hovering
  // up and down over commands. it also prevents
  // restoring to the original through all of that.
  // additionally when quickly moving your mouse
  // over many commands, unless you're hovered for
  // 50ms, it won't show the snapshot at all. so we
  // optimize for both snapshot showing + restoring
  _snapshot (show) {
    if (show) {
      runnablesStore.attemptingShowSnapshot = true

      this._showTimeout = setTimeout(() => {
        runnablesStore.showingSnapshot = true
        events.emit('show:snapshot', this.props.model.id)
      }, 50)
    } else {
      runnablesStore.attemptingShowSnapshot = false
      clearTimeout(this._showTimeout)

      setTimeout(() => {
        // if we are currently showing a snapshot but
        // we aren't trying to show a different snapshot
        if (runnablesStore.showingSnapshot && !runnablesStore.attemptingShowSnapshot) {
          runnablesStore.showingSnapshot = false
          events.emit('hide:snapshot', this.props.model.id)
        }
      }, 50)
    }
  }

  // the following several methods track if the command's state has been
  // active for more than the LONG_RUNNING_THRESHOLD and set the model's
  // isLongRunning flag to true, which propagates up to its test to
  // auto-expand it
  componentWillMount () {
    this._prevState = this.props.model.state

    if (this._isActive()) {
      this._startTimingActive()
    }
  }

  componentWillReact () {

    if (this._becameActive()) {
      this._startTimingActive()
    }

    if (this._becameInactive()) {
      clearTimeout(this._activeTimeout)
      action('became:inactive', () => this.props.model.isLongRunning = false)()
    }

    this._prevState = this.props.model.state
  }

  _startTimingActive () {
    this._activeTimeout = setTimeout(action('became:long:running', () => {
      if (this._isActive()) {
        this.props.model.isLongRunning = true
      }
    }), LONG_RUNNING_THRESHOLD)
  }

  _becameActive () {
    return !this._wasActive() && this._isActive()
  }

  _becameInactive () {
    return this._wasActive() && !this._isActive()
  }

  _wasActive () {
    return this._prevState === 'pending'
  }

  _isActive () {
    return this.props.model.state === 'pending'
  }
}

export { Aliases, Message }
export default Command
