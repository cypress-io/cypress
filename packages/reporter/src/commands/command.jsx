import _ from 'lodash'
import cs from 'classnames'
import Markdown from 'markdown-it'
import { action, observable } from 'mobx'
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
const formattedMessage = (message) => message ? md.renderInline(message) : ''
const visibleMessage = (model) => {
  if (model.visible) return ''

  return model.numElements > 1 ?
    'One or more matched elements are not visible.' :
    'This element is not visible.'
}

const shouldShowCount = (aliasesWithDuplicates, aliasName, model) => {
  if (model.aliasType !== 'route') {
    return false
  }

  return _.includes(aliasesWithDuplicates, aliasName)
}

const AliasReference = observer(({ aliasObj, model, aliasesWithDuplicates }) => {
  if (shouldShowCount(aliasesWithDuplicates, aliasObj.name, model)) {
    return (
      <Tooltip placement='top' title={`Found ${aliasObj.ordinal} alias for: '${aliasObj.name}'`}>
        <span>
          <span className={`command-alias ${model.aliasType} show-count`}>@{aliasObj.name}</span>
          <span className={'command-alias-count'}>{aliasObj.cardinal}</span>
        </span>
      </Tooltip>
    )
  }

  return (
    <Tooltip placement='top' title={`Found an alias for: '${aliasObj.name}'`}>
      <span className={`command-alias ${model.aliasType}`}>@{aliasObj.name}</span>
    </Tooltip>
  )
})

const AliasesReferences = observer(({ model, aliasesWithDuplicates }) => (
  <span>
    {_.map([].concat(model.referencesAlias), (aliasObj) => (
      <span className="command-alias-container" key={aliasObj.name + aliasObj.cardinal}>
        <AliasReference aliasObj={aliasObj} model={model} aliasesWithDuplicates={aliasesWithDuplicates} />
      </span>
    ))}
  </span>
))

const Aliases = observer(({ model, aliasesWithDuplicates }) => {
  if (!model.alias) return null

  return (
    <span>
      {_.map([].concat(model.alias), (alias) => (
        <Tooltip key={alias} placement='top' title={`${model.displayMessage} aliased as: '${alias}'`}>
          <span className={cs('command-alias', `${model.aliasType}`, { 'show-count': shouldShowCount(aliasesWithDuplicates, alias, model) })}>
            {alias}
          </span>
        </Tooltip>
      ))}
    </span>
  )
})

const Message = observer(({ model }) => (
  <span>
    <i className={`fa fa-circle ${model.renderProps.indicator}`}></i>
    <span
      className='command-message-text'
      dangerouslySetInnerHTML={{ __html: formattedMessage(model.displayMessage) }}
    />
  </span>
))

@observer
class Command extends Component {
  @observable isOpen = false

  static defaultProps = {
    appState,
    events,
    runnablesStore,
  }

  render () {
    const { model, aliasesWithDuplicates } = this.props
    const message = model.displayMessage

    return (
      <li
        className={cs(
          'command',
          `command-name-${model.name ? nameClassName(model.name) : ''}`,
          `command-state-${model.state}`,
          `command-type-${model.type}`,
          {
            'command-is-event': !!model.event,
            'command-is-invisible': model.visible != null && !model.visible,
            'command-has-num-elements': model.state !== 'pending' && model.numElements != null,
            'command-other-pinned': this._isOtherCommandPinned(),
            'command-is-pinned': this._isPinned(),
            'command-with-indicator': !!model.renderProps.indicator,
            'command-scaled': message && message.length > 100,
            'no-elements': !model.numElements,
            'multiple-elements': model.numElements > 1,
            'command-has-duplicates': model.hasDuplicates,
            'command-is-duplicate': model.isDuplicate,
            'command-is-open': this.isOpen,
          }
        )}
        onMouseOver={() => this._snapshot(true)}
        onMouseOut={() => this._snapshot(false)}
      >
        <FlashOnClick
          message='Printed output to your console'
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
            <span className='command-expander' onClick={this._toggleOpen}>
              <i className='fa'></i>
            </span>
            <span className='command-method'>
              <span>{model.event ? `(${displayName(model)})` : displayName(model)}</span>
            </span>
            <span className='command-message'>
              {model.referencesAlias ? <AliasesReferences model={model} aliasesWithDuplicates={aliasesWithDuplicates} /> : <Message model={model} />}
            </span>
            <span className='command-controls'>
              <Tooltip placement='top' title={visibleMessage(model)}>
                <i className='command-invisible fa fa-eye-slash'></i>
              </Tooltip>
              <Tooltip placement='top' title={`${model.numElements} matched elements`}>
                <span className='num-elements'>{model.numElements}</span>
              </Tooltip>
              <span className='alias-container'>
                <Aliases model={model} aliasesWithDuplicates={aliasesWithDuplicates} />
                <Tooltip placement='top' title={`This event occurred ${model.numDuplicates} times`}>
                  <span className={cs('num-duplicates', { 'has-alias': model.alias })}>{model.numDuplicates}</span>
                </Tooltip>
              </span>
            </span>
          </div>
        </FlashOnClick>
        {this._duplicates()}
      </li>
    )
  }

  _duplicates () {
    const { appState, events, model, runnablesStore } = this.props

    if (!this.isOpen || !model.hasDuplicates) return null

    return (
      <ul className='duplicates'>
        {_.map(model.duplicates, (duplicate) => (
          <Command
            key={duplicate.id}
            model={duplicate}
            appState={appState}
            events={events}
            runnablesStore={runnablesStore}
          />
        ))}
      </ul>
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

  @action _toggleOpen = (e) => {
    e.stopPropagation()

    this.isOpen = !this.isOpen
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
    const { model, runnablesStore } = this.props

    if (show) {
      runnablesStore.attemptingShowSnapshot = true

      this._showTimeout = setTimeout(() => {
        runnablesStore.showingSnapshot = true
        this.props.events.emit('show:snapshot', model.id)
      }, 50)
    } else {
      runnablesStore.attemptingShowSnapshot = false
      clearTimeout(this._showTimeout)

      setTimeout(() => {
        // if we are currently showing a snapshot but
        // we aren't trying to show a different snapshot
        if (runnablesStore.showingSnapshot && !runnablesStore.attemptingShowSnapshot) {
          runnablesStore.showingSnapshot = false
          this.props.events.emit('hide:snapshot', model.id)
        }
      }, 50)
    }
  }
}

export { Aliases, AliasesReferences, Message }

export default Command
