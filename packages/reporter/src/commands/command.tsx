import _ from 'lodash'
import cs from 'classnames'
import Markdown from 'markdown-it'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'

import appState, { AppState } from '../lib/app-state'
import events, { Events } from '../lib/events'
import FlashOnClick from '../lib/flash-on-click'
import { TimeoutID } from '../lib/types'
import runnablesStore, { RunnablesStore } from '../runnables/runnables-store'
import { Alias, AliasObject } from '../instruments/instrument-model'

import CommandModel from './command-model'
import TestError from '../errors/test-error'

import ChevronIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/chevron-down-small_x8.svg'
import HiddenIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/general-eye-closed_x16.svg'
import PinIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/command-pin_x12.svg'
import RunningIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/status-running_x16.svg'

const md = new Markdown()

const displayName = (model: CommandModel) => model.displayName || model.name
const nameClassName = (name: string) => name.replace(/(\s+)/g, '-')
const formattedMessage = (message: string) => message ? md.renderInline(message) : ''
const invisibleMessage = (model: CommandModel) => {
  return model.numElements > 1 ?
    'One or more matched elements are not visible.' :
    'This element is not visible.'
}
const numberOfChildrenMessage = (numChildren, event?: boolean) => {
  if (event) {
    return `This event occurred ${numChildren} times`
  }

  return `${numChildren} ${numChildren > 1 ? 'logs' : 'log'} currently hidden`
}

const shouldShowCount = (aliasesWithDuplicates: Array<Alias> | null, aliasName: Alias, model: CommandModel) => {
  if (model.aliasType !== 'route') {
    return false
  }

  return _.includes(aliasesWithDuplicates, aliasName)
}

const NavColumn = observer(({ model, toggleColumnPin }) => (
  <>
    <div className='command-number-column' onClick={toggleColumnPin}>
      {<PinIcon className='command-pin' />}
      {model._isPending() && <RunningIcon className='fa-spin' />}
      {!model._isPending() && <span className='command-number'>{model.number || ''}</span>}
    </div>
    <div className='command-expander-column' onClick={() => model.toggleOpen()}>
      {/* if event occurred multiple types, no need render expand/collapse toggle & the children because the details are the same. */}
      {!model.event && model.hasChildren && <ChevronIcon className={cs('command-expander', { 'command-expander-is-open': model.hasChildren && !!model.isOpen })} />}
    </div>
  </>
))

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
  <span className='command-aliases'>
    {_.map(([] as Array<AliasObject>).concat((model.referencesAlias as AliasObject)), (aliasObj) => (
      <span className='command-alias-container' key={aliasObj.name + aliasObj.cardinal}>
        <AliasReference aliasObj={aliasObj} model={model} aliasesWithDuplicates={aliasesWithDuplicates} />
      </span>
    ))}
  </span>
))

interface InterceptionsProps {
  model: CommandModel
}

const Interceptions = observer(({ model }: InterceptionsProps) => {
  if (!model.renderProps.interceptions?.length) return null

  function getTitle () {
    return (
      <span>
        {model.renderProps.wentToOrigin ? '' : <>This request did not go to origin because the response was stubbed.<br/></>}
        This request matched:
        <ul>
          {model.renderProps.interceptions?.map(({ command, alias, type }, i) => {
            return (<li key={i}>
              <code>cy.{command}()</code> {type} with {alias ? <>alias <code>@{alias}</code></> : 'no alias'}
            </li>)
          })}
        </ul>
      </span>
    )
  }

  const count = model.renderProps.interceptions.length

  const displayAlias = _.chain(model.renderProps.interceptions).last().get('alias').value()

  return (
    <Tooltip placement='top' title={getTitle()} className='cy-tooltip'>
      <span>
        <span className={cs('command-interceptions', 'route', count > 1 && 'show-count')}>
          {model.renderProps.status && <span className='status'>{model.renderProps.status} </span>}
          {displayAlias || <em className='no-alias'>no alias</em>}
        </span>
        {count > 1 && <span className={'command-interceptions-count'}>{count}</span>}
      </span>
    </Tooltip>
  )
})

interface AliasesProps {
  model: CommandModel
  aliasesWithDuplicates: Array<Alias> | null
}

const Aliases = observer(({ model, aliasesWithDuplicates }: AliasesProps) => {
  if (!model.alias || model.aliasType === 'route') return null

  return (
    <span>
      {_.map(([] as Array<Alias>).concat(model.alias), (alias) => {
        const aliases = [alias]

        if (model.hasChildren && !model.isOpen) {
          aliases.push(..._.compact(model.children.map((dupe) => dupe.alias)))
        }

        return (
          <Tooltip key={alias} placement='top' title={`${model.displayMessage} aliased as: ${aliases.map((alias) => `'${alias}'`).join(', ')}`} className='cy-tooltip'>
            <span className={cs('command-alias', `${model.aliasType}`, { 'show-count': shouldShowCount(aliasesWithDuplicates, alias, model) })}>
              {aliases.join(', ')}
            </span>
          </Tooltip>
        )
      })}
    </span>
  )
})

interface MessageProps {
  model: CommandModel
}

const Message = observer(({ model }: MessageProps) => (
  <span className='command-message'>
    {!!model.renderProps.indicator && (
      <i
        className={
          cs(
            model.renderProps.wentToOrigin ? 'fas' : 'far',
            'fa-circle',
            `command-message-indicator-${model.renderProps.indicator}`,
          )
        }
      />
    )}
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
  if (!model.timeout || !model.wallClockStartedAt) {
    return <div className='command-progress'><span /></div>
  }

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
  groupId?: number
}

@observer
class Command extends Component<Props> {
  @observable isOpen: boolean|null = null
  private _showTimeout?: TimeoutID

  static defaultProps = {
    appState,
    events,
    runnablesStore,
  }

  render () {
    const { model, aliasesWithDuplicates } = this.props
    const message = model.displayMessage

    if (model.group && this.props.groupId !== model.group) {
      return null
    }

    if (model.showError) {
      return <TestError model={model} onPrintToConsole={this._toggleColumnPin}/>
    }

    const commandName = model.name ? nameClassName(model.name) : ''
    const displayNumOfElements = model.state !== 'pending' && model.numElements != null && model.numElements !== 1
    const isSystemEvent = model.type === 'system' && model.event
    const isSessionCommand = commandName === 'session'
    const displayNumOfChildren = !isSystemEvent && !isSessionCommand && model.hasChildren && !model.isOpen

    let groupPlaceholder: Array<JSX.Element> = []

    const cmdGroupClass = `command-group-id-${model.group}`

    if (model.groupLevel !== undefined) {
      // cap the group nesting to 6 levels keep the log text legible
      const level = model.groupLevel < 6 ? model.groupLevel : 5

      for (let i = 1; i < level; i++) {
        groupPlaceholder.push(<span key={`${this.props.groupId}-${level}`} className={`command-group-id-${model.group} command-group-block`} />)
      }
    }

    return (
      <li
        className={cs(
          'command',
          `command-name-${commandName}`,
          {
            'command-scaled': message && message.length > 100,
          },
        )}
      >
        <div
          className={
            cs(
              'command-wrapper',
              `command-type-${model.type}`,
              `command-state-${model.state}`,
              {
                'command-is-pinned': this._isPinned(),
                'command-is-event': !!model.event,
                'command-has-console-props': model.hasConsoleProps,
                'command-has-snapshot': model.hasSnapshot,
              },
            )
          }
        >
          <NavColumn model={model} toggleColumnPin={this._toggleColumnPin} />
          <FlashOnClick
            message='Printed output to your console'
            onClick={this._toggleColumnPin}
            shouldShowMessage={this._shouldShowClickMessage}
            wrapperClassName={cs('command-pin-target', cmdGroupClass, { 'command-group': !!this.props.groupId })}
          >
            <div
              className='command-wrapper-text'
              onMouseEnter={() => this._snapshot(true)}
              onMouseLeave={() => this._snapshot(false)}
            >
              {groupPlaceholder}
              <span className={cs('command-info')}>
                <span className='command-method'>
                  <span>
                    {model.event && model.type !== 'system' ? `(${displayName(model)})` : displayName(model)}
                  </span>
                </span>
                {model.referencesAlias ?
                  <AliasesReferences model={model} aliasesWithDuplicates={aliasesWithDuplicates} />
                  : <Message model={model} />
                }
              </span>
              <span className='command-controls'>
                {model.isInvisible && (
                  <Tooltip placement='top' title={invisibleMessage(model)} className='cy-tooltip'>
                    <span>
                      <HiddenIcon className='command-invisible' />
                    </span>
                  </Tooltip>
                )}
                {displayNumOfElements && (
                  <Tooltip placement='top' title={`${model.numElements} matched elements`} className='cy-tooltip'>
                    <span className={cs('num-elements', 'command-num-elements')}>{model.numElements}</span>
                  </Tooltip>
                )}
                <span className='alias-container'>
                  <Interceptions model={model} />
                  <Aliases model={model} aliasesWithDuplicates={aliasesWithDuplicates} />
                  {displayNumOfChildren && (
                    <Tooltip placement='top' title={numberOfChildrenMessage(model.numChildren, model.event)} className='cy-tooltip'>
                      <span className={cs('num-children', 'command-num-children', { 'has-alias': model.alias })}>
                        {model.numChildren}
                      </span>
                    </Tooltip>
                  )}
                </span>
              </span>
              <Progress model={model} />
            </div>
          </FlashOnClick>
        </div>
        {(model.hasChildren && model.isOpen) && this._children()}
      </li>
    )
  }

  _children () {
    const { appState, events, model, runnablesStore } = this.props

    return (
      <ul className='cmd-children'>
        {_.map(model.children, (child) => (
          <Command
            key={child.id}
            model={child}
            appState={appState}
            events={events}
            runnablesStore={runnablesStore}
            aliasesWithDuplicates={null}
            groupId={model.id}
          />
        ))}
      </ul>
    )
  }

  _isPinned () {
    return this.props.appState.pinnedSnapshotId === this.props.model.id
  }

  _shouldShowClickMessage = () => {
    if (this.props.model.hasChildren) {
      return false
    }

    return !this.props.appState.isRunning && !!this.props.model.hasConsoleProps
  }

  @action _toggleColumnPin = () => {
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

    // do not trigger the show:snapshot event for commands groups
    // TODO: remove this behavior in 10.0+ when a group
    // can both be expanded and collapsed and pinned
    if (model.hasChildren) {
      return
    }

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
