/* global Cypress */
import _ from 'lodash'
import cs from 'classnames'
import Markdown from 'markdown-it'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component, MouseEvent, ReactNode } from 'react'
import 'regenerator-runtime/runtime'
import { ObjectInspector, chromeLight } from 'react-inspector'
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
const formatOptions = (options: Record<string, any>) => {
  let obj = Object.assign({}, options)

  Object.keys(obj).forEach((k) => {
    if (obj[k] === undefined) {
      obj[k] = 'undefined'
    }

    if (typeof obj[k] === 'string' && obj[k].match(/[ ,:]/)) {
      obj[k] = `__QUOTE__${obj[k].replace(/:/g, '__COLON__').replace(/,/g, '__COMMA__')}__QUOTE__`
    }
  })

  return JSON.stringify(obj)
  .replace(/"/g, '')
  .replace(/:/g, ': ')
  .replace(/,/g, ', ')
  .replace(/__COLON__/g, ':')
  .replace(/__COMMA__/g, ',')
  .replace(/__QUOTE__/g, `"`)
}
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

const inspectorTheme = (base: string, name: string) => ({
  ...chromeLight,
  ...({
    BASE_BACKGROUND_COLOR: 'inherit',
    BASE_COLOR: base,
    OBJECT_NAME_COLOR: name,
    OBJECT_VALUE_NULL_COLOR: base,
    OBJECT_VALUE_UNDEFINED_COLOR: base,
    OBJECT_VALUE_REGEXP_COLOR: base,
    OBJECT_VALUE_STRING_COLOR: base,
    OBJECT_VALUE_SYMBOL_COLOR: base,
    OBJECT_VALUE_NUMBER_COLOR: base,
    OBJECT_VALUE_BOOLEAN_COLOR: base,
    OBJECT_VALUE_FUNCTION_PREFIX_COLOR: base,
  }),
})

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

const Message = observer(({ model, toggleSubject, toggleExpected, toggleActual }) => (
  <span>
    <span className='command-message-text-wrap'>
      <i className={`fa fa-circle ${model.renderProps.indicator}`}></i>
      {
        (!model.subject && !model.expected && !model.actual)
          ? <span
            className='command-message-text'
            dangerouslySetInnerHTML={{ __html: formattedMessage(model.displayMessage) }}
          />
          : <SummarizedMessage
            model={model}
            toggleSubject={toggleSubject}
            toggleExpected={toggleExpected}
            toggleActual={toggleActual}
          />
      }
    </span>
    { model.options && Object.keys(model.options).length > 0
      ?
      <span className="command-message-options" onClick={(e) => e.stopPropagation()}>
        <ObjectInspector
          theme={inspectorTheme('#999', '#777')}
          data={model.options}
          // 10 below is an arbitrary big number
          // @ts-ignore
          expandLevel={Cypress.config('isInteractive') ? 0 : 10}
        />
      </span>
      : null
    }
  </span>
))

interface SummarizedMessageProps {
  model: CommandModel
  toggleSubject: (e: MouseEvent) => void
  toggleExpected: (e: MouseEvent) => void
  toggleActual: (e: MouseEvent) => void
}

const SummarizedMessage = ({ model, toggleSubject, toggleExpected, toggleActual }: SummarizedMessageProps) => {
  const tags: string[] = []

  const decodeTag = (i: number) => {
    const tag = tags[i]

    if (tag === 'this' && model.subject) {
      const summary = model.subject.summary

      return <SummaryButton key={`button-${i}`} summary={summary} toggle={toggleSubject} />
    }

    if (tag === 'exp' && model.expected) {
      const summary = model.expected.summary

      return <SummaryButton key={`button-${i}`} summary={summary} toggle={toggleExpected} />
    }

    if (tag === 'act' && model.actual) {
      const summary = model.actual.summary

      return <SummaryButton key={`button-${i}`} summary={summary} toggle={toggleActual} />
    }

    return <span key={`normal-${i}`}>{`%{${tag}}`}</span>
  }

  return (
    <span className="command-message-text">
      {
        (model.displayMessage || '')
        .replace(/%{(.*?)}/g, (_m: string, m0: string) => {
          tags.push(m0)

          return '<<tag>>'
        })
        .split('<<tag>>')
        .reduce((prev: ReactNode[], curr: string, i: number) => {
          return prev.concat(
            <span key={`text-${i}`} dangerouslySetInnerHTML={{ __html: formattedMessage(curr) }} />,
            tags[i] ? decodeTag(i) : undefined,
          )
        }, [])
      }
    </span>
  )
}

interface SummmaryButtonProps {
  summary: string
  toggle: (e: MouseEvent) => void
}

const SummaryButton = ({ summary, toggle }: SummmaryButtonProps) => {
  return (
    <strong>
      <a className="command-message-summarized-text" onClick={toggle}>
        {summary}
      </a>
    </strong>
  )
}

interface DetailViewerProps {
  name: string
  value: any
}

const DetailViewer = ({ name, value }: DetailViewerProps) => {
  return (
    <div className="command-detail-viewer">
      <div className="command-detail-viewer-title">{name} details</div>
      <div className="command-detail-viewer-content">
        {
          typeof (value) === 'string'
            ? value
            : <ObjectInspector theme={inspectorTheme('#555', '#555')} data={value} expandLevel={1} />
        }
      </div>
    </div>
  )
}

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
  @observable showSubject = false
  @observable showExpected = false
  @observable showActual = false
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
            'command-other-pinned': this._isOtherCommandPinned(),
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
              {
                model.referencesAlias
                  ? <AliasesReferences model={model} aliasesWithDuplicates={aliasesWithDuplicates} />
                  : <Message model={model} toggleSubject={this._toggleSubject} toggleExpected={this._toggleExpected} toggleActual={this._toggleActual} />
              }
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
        </FlashOnClick>
        {
          this.showSubject
            ? <DetailViewer name='subject' value={model.subject && model.subject.value} />
            : null
        }
        {
          this.showExpected
            ? <DetailViewer name='expected' value={model.expected && model.expected.value} />
            : null
        }
        {
          this.showActual
            ? <DetailViewer name='actual' value={model.actual && model.actual.value} />
            : null
        }
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

  _isOtherCommandPinned () {
    const pinnedId = this.props.appState.pinnedSnapshotId

    return pinnedId != null && pinnedId !== this.props.model.id
  }

  _shouldShowClickMessage = () => {
    return !this.props.appState.isRunning && this._isPinned()
  }

  @action _toggleOpen = (e: MouseEvent) => {
    e.stopPropagation()

    this.isOpen = !this.isOpen
  }

  @action _toggleSubject = (e: MouseEvent) => {
    e.stopPropagation()

    this.showSubject = !this.showSubject
  }

  @action _toggleExpected = (e: MouseEvent) => {
    e.stopPropagation()

    this.showExpected = !this.showExpected
  }

  @action _toggleActual = (e: MouseEvent) => {
    e.stopPropagation()

    this.showActual = !this.showActual
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

export { Aliases, AliasesReferences, Message }

export default Command
