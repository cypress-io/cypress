import _ from 'lodash'
import cs from 'classnames'
import Markdown from 'markdown-it'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'

import appState from '../lib/app-state'
import events from '../lib/events'
import FlashOnClick from '../lib/flash-on-click'
import runnablesStore from '../runnables/runnables-store'

const md = new Markdown()

const displayName = (model) => model.displayName || model.name
const nameClassName = (name) => name.replace(/(\s+)/g, '-')
const getMessage = (model) => model.renderProps.message || model.message
const formattedMessage = (message) => message ? md.renderInline(message) : ''
const visibleMessage = (model) => {
  if (model.visible) return ''

  return model.numElements > 1 ?
    'One or more matched elements are not visible.' :
    'This element is not visible.'
}

const AliasesReferences = observer(({ model }) => (
  <span>
    {_.map([].concat(model.referencesAlias), (alias) => (
      <Tooltip key={alias} placement='top' title={`Found an alias for: '${alias}'`}>
        <span className={`command-alias ${model.aliasType}`}>@{alias}</span>
      </Tooltip>
    ))}
  </span>
))

const Aliases = observer(({ model }) => {
  if (!model.alias) return null

  return (
    <span>
      {_.map([].concat(model.alias), (alias) => (
        <Tooltip key={alias} placement='top' title={`${model.message} aliased as: '${alias}'`}>
          <span className={`command-alias ${model.aliasType}`}>{alias}</span>
        </Tooltip>
      ))}
    </span>
  )
})

const Message = observer(({ model }) => (
  <span>
    <i className={`fa fa-circle ${model.renderProps.indicator}`}></i>
    <span className='command-message-text' dangerouslySetInnerHTML={{ __html: formattedMessage(getMessage(model)
      ) }} />
  </span>
))

@observer
class Command extends Component {
  static defaultProps = {
    appState,
    events,
    runnablesStore,
  }

  render () {
    const { model } = this.props
    const message = getMessage(model)

    return (
      <li
        className={cs(
          'command',
          `command-name-${nameClassName(model.name)}`,
          `command-state-${model.state}`,
          `command-type-${model.type}`,
          {
            'command-is-event': !!model.event,
            'command-is-invisible': model.visible != null && !model.visible,
            'command-has-num-elements': model.state !== 'pending' && model.numElements != null,
            'command-has-no-elements': !model.numElements,
            'command-has-multiple-elements': model.numElements > 1,
            'command-other-pinned': this._isOtherCommandPinned(),
            'command-is-pinned': this._isPinned(),
            'command-with-indicator': !!model.renderProps.indicator,
            'command-scaled': message && message.length > 100,
          }
        )}
        onMouseOver={() => this._snapshot(true)}
        onMouseOut={() => this._snapshot(false)}
      >
        <FlashOnClick
          message='Pinned snapshot and printed output to your console!'
          onClick={this._onClick}
          shouldShowMessage={this._shouldShowClickMessage}
        >
          <div className='command-wrapper'>
            <span className='command-number'>
              <i className='fa fa-spinner fa-spin'></i>
              <span>{model.number || ''}</span>
            </span>
            <span className='command-pin'>
              <i className='fa fa-thumb-tack'></i>
            </span>
            <span className='command-method'>
              <span>{model.event ? `(${displayName(model)})` :  displayName(model)}</span>
            </span>
            <span className='command-message'>
              {model.referencesAlias ? <AliasesReferences model={model} /> : <Message model={model} />}
            </span>
            <span className='command-controls'>
              <Aliases model={model} />
              <Tooltip placement='top' title={visibleMessage(model)}>
                <i className='command-invisible fa fa-eye-slash'></i>
              </Tooltip>
              <Tooltip placement='top' title={`${model.numElements} matched elements`}>
                <span className='command-num-elements'>{model.numElements}</span>
              </Tooltip>
            </span>
          </div>
        </FlashOnClick>
      </li>
    )
  }

  _isPinned () {
    return this.props.appState.pinnedSnapshotId === this.props.model.id
  }

  _isOtherCommandPinned () {
    const pinnedId = this.props.appState.pinnedSnapshotId
    return pinnedId != null && pinnedId !== this.props.model.id
  }

  _shouldShowClickMessage = () => {
    return !this.props.appState.isRunning && this._isPinned()
  }

  @action _onClick = () => {
    if (this.props.appState.isRunning) return

    const { id } = this.props.model

    if (this._isPinned()) {
      this.props.appState.pinnedSnapshotId = null
      this.props.events.emit('unpin:snapshot', id)
      this._snapshot(true)
    } else {
      this.props.appState.pinnedSnapshotId = id
      this.props.events.emit('pin:snapshot', id)
      this.props.events.emit('show:command', this.props.model.id)
    }
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
    const { runnablesStore } = this.props

    if (show) {
      runnablesStore.attemptingShowSnapshot = true

      this._showTimeout = setTimeout(() => {
        runnablesStore.showingSnapshot = true
        this.props.events.emit('show:snapshot', this.props.model.id)
      }, 50)
    } else {
      runnablesStore.attemptingShowSnapshot = false
      clearTimeout(this._showTimeout)

      setTimeout(() => {
        // if we are currently showing a snapshot but
        // we aren't trying to show a different snapshot
        if (runnablesStore.showingSnapshot && !runnablesStore.attemptingShowSnapshot) {
          runnablesStore.showingSnapshot = false
          this.props.events.emit('hide:snapshot', this.props.model.id)
        }
      }, 50)
    }
  }
}

export { Aliases, AliasesReferences, Message }
export default Command
