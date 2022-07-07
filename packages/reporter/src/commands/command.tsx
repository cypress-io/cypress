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

import CommandModel, { RenderProps } from './command-model'
import TestError from '../errors/test-error'

import ChevronIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/chevron-down-small_x8.svg'
import HiddenIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/general-eye-closed_x16.svg'
import PinIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/object-pin_x16.svg'
import RunningIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/status-running_x16.svg'

const md = new Markdown()

const displayName = (model: CommandModel) => model.displayName || model.name
const nameClassName = (name: string) => name.replace(/(\s+)/g, '-')

export const formattedMessage = (message: string) => {
  if (!message) return ''

  const searchText = ['to match', 'to equal']
  const regex = new RegExp(searchText.join('|'))
  const split = message.split(regex)
  const matchingText = searchText.find((text) => message.includes(text))
  const textToConvert = [split[0].trim(), ...(matchingText ? [matchingText] : [])].join(' ')
  const converted = md.renderInline(textToConvert)
  const assertion = (split[1] && [`<strong>${split[1].trim()}</strong>`]) || []

  return [converted, ...assertion].join(' ')
}

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

/**
 * NavColumns Rules:
 *   > Command Number Column
 *      - When the command is executing, it is pending and renders the pending icon
 *      - When the command is finished, it displays the command number
 *        - Commands will render a command number, where Events and System logs do not
 *      - When the command is finished and the user has pinned the log, it displays the pin icon
 *
 *   > Expander Column
 *      - When the log is a group log and it has children logs, it will display the chevron icon
 */
const NavColumns = observer(({ model, isPinned, toggleColumnPin }) => (
  <>
    <div className='command-number-column' onClick={toggleColumnPin}>
      {model._isPending() && <RunningIcon className='fa-spin' />}
      {(!model._isPending() && isPinned) && <PinIcon className='command-pin' />}
      {(!model._isPending() && !isPinned) && model.number}
    </div>
    {model.hasChildren && (
      <div className='command-expander-column' onClick={() => model.toggleOpen()}>
        <ChevronIcon className={cs('command-expander', { 'command-expander-is-open': model.hasChildren && !!model.isOpen })} />
      </div>
    )}
  </>
))

interface AliasReferenceProps {
  aliasObj: AliasObject
  model: CommandModel
  aliasesWithDuplicates: Array<Alias> | null
}

const AliasReference = observer(({ aliasObj, model, aliasesWithDuplicates }: AliasReferenceProps) => {
  const showCount = shouldShowCount(aliasesWithDuplicates, aliasObj.name, model)
  const alias = (
    <span className={cs('command-alias', model.aliasType, { 'has-multiple-aliases': showCount })}>
      @{aliasObj.name}
    </span>
  )

  if (showCount) {
    return (
      <Tooltip placement='top' title={`Found ${aliasObj.ordinal} alias for: '${aliasObj.name}'`} className='cy-tooltip'>
        <span>
          {alias}
          <span className={cs(model.aliasType, 'command-alias-count')}>{aliasObj.cardinal}</span>
        </span>
      </Tooltip>
    )
  }

  return (
    <Tooltip placement='top' title={`Found an alias for: '${aliasObj.name}'`} className='cy-tooltip'>
      {alias}
    </Tooltip>
  )
})

interface AliasesReferencesProps {
  model: CommandModel
  aliasesWithDuplicates: Array<Alias> | null
}

const AliasesReferences = observer(({ model, aliasesWithDuplicates }: AliasesReferencesProps) => {
  const aliases = ([] as Array<AliasObject>).concat((model.referencesAlias as AliasObject))

  if (!aliases.length) {
    return null
  }

  return (
    <span className='command-aliases'>
      {aliases.map((aliasObj) => (
        <AliasReference
          key={aliasObj.name + aliasObj.cardinal}
          aliasObj={aliasObj}
          model={model}
          aliasesWithDuplicates={aliasesWithDuplicates}
        />
      ))}
    </span>
  )
})

const Interceptions = observer(({ interceptions, wentToOrigin, status }: RenderProps) => {
  if (!interceptions?.length) {
    return null
  }

  const interceptsTitle = (
    <span>
      {wentToOrigin ? '' : <>This request did not go to origin because the response was stubbed.<br/></>}
        This request matched:
      <ul>
        {interceptions?.map(({ command, alias, type }, i) => (
          <li key={i}>
            <code>cy.{command}()</code> {type} with {alias ? <>alias <code>@{alias}</code></> : 'no alias'}
          </li>
        ))}
      </ul>
    </span>
  )

  const count = interceptions.length
  const displayAlias = interceptions[count - 1].alias

  const intercepts = (
    <span className={cs('command-interceptions', 'route', { 'has-multiple-interceptions': count > 1 })}>
      {status && <span className='status'>{status} </span>}
      {displayAlias || <em className='no-alias'>no alias</em>}
    </span>
  )

  if (count > 1) {
    return (
      <Tooltip placement='top' title={interceptsTitle} className='cy-tooltip'>
        <span>
          {intercepts}
          <span className={'command-interceptions-count route'}> {count}</span>
        </span>
      </Tooltip>
    )
  }

  return (
    <Tooltip placement='top' title={interceptsTitle} className='cy-tooltip'>
      {intercepts}
    </Tooltip>
  )
})

interface AliasesProps {
  model: CommandModel
}

const Aliases = observer(({ model }: AliasesProps) => {
  if (!model.alias || model.aliasType === 'route') return null

  const aliases = ([] as Array<Alias>).concat(model.alias)

  return (
    <span>
      {aliases.map((alias) => {
        const aliases = [alias]

        if (model.hasChildren && !model.isOpen) {
          aliases.push(..._.compact(model.children.map((dupe) => dupe.alias)))
        }

        return (
          <Tooltip key={alias} placement='top' title={`${model.displayMessage} aliased as: ${aliases.map((alias) => `'${alias}'`).join(', ')}`} className='cy-tooltip'>
            <span className={cs('command-alias', `${model.aliasType}`)}>
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
    {!!model.displayMessage && <span
      className='command-message-text'
      dangerouslySetInnerHTML={{ __html: formattedMessage(model.displayMessage) }}
    />}
  </span>
))

interface ProgressProps {
  model: CommandModel
}

const Progress = observer(({ model }: ProgressProps) => {
  if (model.state !== 'pending' || !model.timeout || !model.wallClockStartedAt) {
    return null
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

    if (model.group && this.props.groupId !== model.group) {
      return null
    }

    if (model.showError) {
      // this error is rendered if an error occurs in session validation executed by cy.session
      return <TestError model={model} onPrintToConsole={this._toggleColumnPin}/>
    }

    const commandName = model.name ? nameClassName(model.name) : ''
    const displayNumOfElements = model.state !== 'pending' && model.numElements != null && model.numElements !== 1
    const isSystemEvent = model.type === 'system' && model.event
    const isSessionCommand = commandName === 'session'
    const displayNumOfChildren = !isSystemEvent && !isSessionCommand && model.hasChildren && !model.isOpen

    const groupPlaceholder: Array<JSX.Element> = []

    if (model.groupLevel !== undefined) {
      // cap the group nesting to 5 levels to keep the log text legible
      const level = model.groupLevel < 6 ? model.groupLevel : 5

      for (let i = 1; i < level; i++) {
        groupPlaceholder.push(<span key={`${this.props.groupId}-${i}`} className='command-group-block' />)
      }
    }

    return (
      <li className={cs('command', `command-name-${commandName}`)}>
        <div
          className={
            cs(
              'command-wrapper',
              `command-state-${model.state}`,
              `command-type-${model.type}`,
              {
                'command-is-event': !!model.event,
                'command-is-pinned': this._isPinned(),
                'command-is-interactive': model.hasConsoleProps || model.hasSnapshot,
              },
            )
          }
        >
          <NavColumns model={model} isPinned={this._isPinned()} toggleColumnPin={this._toggleColumnPin} />
          <FlashOnClick
            message='Printed output to your console'
            onClick={this._toggleColumnPin}
            shouldShowMessage={this._shouldShowClickMessage}
            wrapperClassName={cs('command-pin-target', { 'command-group': !!this.props.groupId })}
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
                {!model.visible && (
                  <Tooltip placement='top' title={invisibleMessage(model)} className='cy-tooltip'>
                    <span>
                      <HiddenIcon className='command-invisible' />
                    </span>
                  </Tooltip>
                )}
                {displayNumOfElements && (
                  <Tooltip placement='top' title={`${model.numElements} matched elements`} className='cy-tooltip'>
                    <span className={cs('num-elements', 'command-num-elements')}>
                      {model.numElements}
                    </span>
                  </Tooltip>
                )}
                <span className='alias-container'>
                  <Interceptions {...model.renderProps} />
                  <Aliases model={model} />
                  {displayNumOfChildren && (
                    <Tooltip placement='top' title={numberOfChildrenMessage(model.numChildren, model.event)} className='cy-tooltip'>
                      <span className={cs('num-children', 'command-num-children', { 'has-alias': model.alias })}>
                        {model.numChildren}
                      </span>
                    </Tooltip>
                  )}
                </span>
              </span>
            </div>
          </FlashOnClick>
        </div>
        <Progress model={model} />
        {this._children()}
      </li>
    )
  }

  _children () {
    const { appState, events, model, runnablesStore } = this.props

    if (!model.hasChildren || !model.isOpen) {
      return null
    }

    return (
      <ul className='command-child-container'>
        {model.children.map((child) => (
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
