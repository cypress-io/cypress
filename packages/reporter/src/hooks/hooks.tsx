import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import { FileDetails } from '@packages/ui-components'

import appState, { AppState } from '../lib/app-state'
import Command from '../commands/command'
import Collapsible from '../collapsible/collapsible'
import HookModel, { HookName } from './hook-model'
import FileOpener from '../lib/file-opener'

export interface HookHeaderProps {
  model: HookModel
  number?: number
  isStudio: boolean
  isActive: boolean
}

const HookHeader = ({ model, number, isStudio, isActive }: HookHeaderProps) => (
  <span>
    <span className='hook-name'>
      {model.hookName} {number && `(${number})`} <span className='hook-failed-message'>(failed)</span>
    </span>
    { isStudio && (
      <span className='runnable-controls hook-status'>
        {isActive ? <i className='fas fa-spinner fa-spin' /> : model.commands.length}
      </span>
    )}
  </span>
)

export interface HookOpenInIDEProps {
  invocationDetails: FileDetails
}

const HookOpenInIDE = ({ invocationDetails }: HookOpenInIDEProps) => (
  <FileOpener fileDetails={invocationDetails} className='collapsible-header-extras-button'>
    <i className='fas fa-external-link-alt fa-sm' /> <span>Open in IDE</span>
  </FileOpener>
)

export interface HookProps {
  state?: AppState
  model: HookModel
  showNumber: boolean
  isActive: boolean
}

const Hook = observer(({ state = appState, model, showNumber, isActive }: HookProps) => (
  <li className={cs('hook-item', { 'hook-failed': model.failed })}>
    <Collapsible
      header={<HookHeader model={model} number={showNumber ? model.hookNumber : undefined} isStudio={!!state.extendingTest} isActive={isActive} />}
      headerClass='hook-header'
      headerExtras={!state.extendingTest && model.invocationDetails && <HookOpenInIDE invocationDetails={model.invocationDetails} />}
      isOpen={!state.extendingTest}
    >
      <ul className='commands-container'>
        {_.map(model.commands, (command) => <Command key={command.id} model={command} aliasesWithDuplicates={model.aliasesWithDuplicates} />)}
      </ul>
    </Collapsible>
  </li>
))

export interface HooksModel {
  hooks: Array<HookModel>
  hookCount: { [name in HookName]: number }
  state: string
}

export interface HooksProps {
  model: HooksModel
}

const Hooks = observer(({ model }: HooksProps) => (
  <ul className='hooks-container'>
    {_.map(_.filter(model.hooks, (h) => !!h.commands.length), (hook, index, arr) => (
      <Hook
        key={hook.hookId}
        model={hook}
        showNumber={model.hookCount[hook.hookName] > 1}
        isActive={model.state === 'active' && index === arr.length - 1}
      />
    ))}
  </ul>
))

export { Hook, HookHeader }

export default Hooks
