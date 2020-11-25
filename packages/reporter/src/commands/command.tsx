import _ from 'lodash'
import cs from 'classnames'
import Markdown from 'markdown-it'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component, MouseEvent } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import appState, { AppState } from '../lib/app-state'
import events, { Events } from '../lib/events'
import FlashOnClick from '../lib/flash-on-click'
import { TimeoutID } from '../lib/types'
import runnablesStore, { RunnablesStore } from '../runnables/runnables-store'
import { Alias, AliasObject } from '../instruments/instrument-model'

import CommandModel from './command-model'

const md = new Markdown()

const displayName = (model: CommandModel) => model.displayName || model.name
const nameClassName = (name: string) => name.replace(/(\s+)/g, '-')
const formattedMessage = (message: string) => message ? md.renderInline(message) : ''
const visibleMessage = (model: CommandModel) => {
  if (model.visible) return ''

  return model.numElements > 1 ?
    'One or more matched elements are not visible.' :
    'This element is not visible.'
}

const shouldShowCount = (aliasesWithDuplicates: Array<Alias> | null, aliasName: Alias, model: CommandModel) => {
  if (model.aliasType !== 'route') {
    return false
  }

  return _.includes(aliasesWithDuplicates, aliasName)
}

interface AliasReferenceProps {
  aliasObj: AliasObject
  model: CommandModel
  aliasesWithDuplicates: Array<Alias> | null
}

const AliasReference = observer(({ aliasObj, model, aliasesWithDuplicates }: AliasReferenceProps) => {
  if (shouldShowCount(aliasesWithDuplicates, aliasObj.name, model)) {
    return (
      <Tooltip placement='top' title={`Found ${aliasObj.ordinal} alias for: '${aliasObj.name}'`} className='cy-tooltip'>
        <span>
          <span className={`command-alias ${model.aliasType} show-count`}>@{aliasObj.name}</span>
          <span className={'command-alias-count'}>{aliasObj.cardinal}</span>
        </span>
      </Tooltip>
    )
  }

  return (
    <Tooltip placement='top' title={`Found an alias for: '${aliasObj.name}'`} className='cy-tooltip'>
      <span className={`command-alias ${model.aliasType}`}>@{aliasObj.name}</span>
    </Tooltip>
  )
})

interface AliasesReferencesProps {
  model: CommandModel
  aliasesWithDuplicates: Array<Alias> | null
}

const AliasesReferences = observer(({ model, aliasesWithDuplicates }: AliasesReferencesProps) => (
  <span>
    {_.map(([] as Array<AliasObject>).concat((model.referencesAlias as AliasObject)), (aliasObj) => (
      <span className="command-alias-container" key={aliasObj.name + aliasObj.cardinal}>
        <AliasReference aliasObj={aliasObj} model={model} aliasesWithDuplicates={aliasesWithDuplicates} />
      </span>
    ))}
  </span>
))

interface AliasesProps {
  model: CommandModel
  aliasesWithDuplicates: Array<Alias> | null
}

const Aliases = observer(({ model, aliasesWithDuplicates }: AliasesProps) => {
  if (!model.alias) return null

  return (
    <span>
      {_.map(([] as Array<Alias>).concat(model.alias), (alias) => (
        <Tooltip key={alias} placement='top' title={`${model.displayMessage} aliased as: '${alias}'`} className='cy-tooltip'>
          <span className={cs('command-alias', `${model.aliasType}`, { 'show-count': shouldShowCount(aliasesWithDuplicates, alias, model) })}>
            {alias}
          </span>
        </Tooltip>
      ))}
    </span>
  )
})

interface MessageProps {
  model: CommandModel
}

const Message = observer(({ model }: MessageProps) => (
  <span>
    <i className={`fas fa-circle ${model.renderProps.indicator}`} />
    <span
      className='command-message-text'
      dangerouslySetInnerHTML={{ __html: formattedMessage(model.displayMessage || '') }}
    />
  </span>
))

interface ProgressProps {
  model: CommandModel
}

const Progress = observer(({ model }: ProgressProps) => {
  const timeElapsed = Date.now() - new Date(model.wallClockStartedAt).getTime()
  const timeRemaining = model.timeout ? model.timeout - timeElapsed : 0
  const percentageRemaining = timeRemaining / model.timeout || 0

  // we add a key to the span to ensure a rerender and restart of the animation on change
  return (
    <div className='command-progress'>
      <span style={{ animationDuration: `${timeRemaining}ms`, transform: `scaleX(${percentageRemaining})` }} key={timeRemaining} />
    </div>
  )
})

interface Props {
  model: CommandModel
  aliasesWithDuplicates: Array<Alias> | null
  appState: AppState
  events: Events
  runnablesStore: RunnablesStore
}

@observer
class Command extends Component<Props> {
  @observable isOpen = false
  private _showTimeout?: TimeoutID

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
            'command-is-pinned': this._isPinned(),
            'command-with-indicator': !!model.renderProps.indicator,
            'command-scaled': message && message.length > 100,
            'no-elements': !model.numElements,
            'multiple-elements': model.numElements > 1,
            'command-has-duplicates': model.hasDuplicates,
            'command-is-duplicate': model.isDuplicate,
            'command-is-open': this.isOpen,
          },
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
            <div className='command-wrapper-text'>
              <span className='command-number'>
                <i className='fas fa-spinner fa-spin' />
                <span>{model.number || ''}</span>
              </span>
              <span className='command-pin'>
                <i className='fas fa-thumbtack' />
              </span>
              <span className='command-expander' onClick={this._toggleOpen}>
                <i className='fas' />
              </span>
              <span className='command-method'>
                <span>{model.event ? `(${displayName(model)})` : displayName(model)}</span>
              </span>
              <span className='command-message'>
                {model.referencesAlias ? <AliasesReferences model={model} aliasesWithDuplicates={aliasesWithDuplicates} /> : <Message model={model} />}
              </span>
              <span className='command-controls'>
                <Tooltip placement='top' title={visibleMessage(model)} className='cy-tooltip'>
                  <i className='command-invisible far fa-eye-slash' />
                </Tooltip>
                <Tooltip placement='top' title={`${model.numElements} matched elements`} className='cy-tooltip'>
                  <span className='num-elements'>{model.numElements}</span>
                </Tooltip>
                <span className='alias-container'>
                  <Aliases model={model} aliasesWithDuplicates={aliasesWithDuplicates} />
                  <Tooltip placement='top' title={`This event occurred ${model.numDuplicates} times`} className='cy-tooltip'>
                    <span className={cs('num-duplicates', { 'has-alias': model.alias })}>{model.numDuplicates}</span>
                  </Tooltip>
                </span>
              </span>
            </div>
            <Progress model={model} />
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
            aliasesWithDuplicates={null}
          />
        ))}
      </ul>
    )
  }

  _isPinned () {
    return this.props.appState.pinnedSnapshotId === this.props.model.id
  }

  _shouldShowClickMessage = () => {
    return !this.props.appState.isRunning && this._isPinned()
  }

  @action _toggleOpen = (e: MouseEvent) => {
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
      this.props.appState.pinnedSnapshotId = id as number
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
  _snapshot (show: boolean) {
    const { model, runnablesStore } = this.props

    if (show) {
      runnablesStore.attemptingShowSnapshot = true

      this._showTimeout = setTimeout(() => {
        runnablesStore.showingSnapshot = true
        this.props.events.emit('show:snapshot', model.id)
      }, 50)
    } else {
      runnablesStore.attemptingShowSnapshot = false
      clearTimeout(this._showTimeout as TimeoutID)

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

export { Aliases, AliasesReferences, Message, Progress }

export default Command
