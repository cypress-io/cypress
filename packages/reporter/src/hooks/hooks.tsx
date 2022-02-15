import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import { FileDetails } from '@packages/types'

import appState, { AppState } from '../lib/app-state'
import CommandsContainer from '../commands/CommandsContainer'
import Collapsible from '../collapsible/collapsible'
import HookModel, { HookName } from './hook-model'

import OpenIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/technology-code-editor_x16.svg'
import OpenFileInIDE from '../lib/open-file-in-ide'

export interface HookHeaderProps {
  model: HookModel
  number?: number
}

const HookHeader = ({ model, number }: HookHeaderProps) => (
  <span className='hook-name'>
    {model.hookName} {number && `(${number})`} <span className='hook-failed-message'>(failed)</span>
  </span>
)

export interface HookOpenInIDEProps {
  invocationDetails: FileDetails
}

const HookOpenInIDE = ({ invocationDetails }: HookOpenInIDEProps) => {
  return (
    <OpenFileInIDE fileDetails={invocationDetails} className='hook-open-in-ide'>
      <OpenIcon viewBox="0 0 16 16" width="12" height="12" /> <span>Open in IDE</span>
    </OpenFileInIDE>
  )
}

export interface HookProps {
  model: HookModel
  showNumber: boolean
}

const Hook = observer(({ model, showNumber }: HookProps) => (
  <li className={cs('hook-item', { 'hook-failed': model.failed, 'hook-studio': model.isStudio })}>
    <Collapsible
      header={<HookHeader model={model} number={showNumber ? model.hookNumber : undefined} />}
      headerClass='hook-header'
      headerExtras={model.invocationDetails && <HookOpenInIDE invocationDetails={model.invocationDetails} />}
      isOpen={true}
    >
      <CommandsContainer
        commands={model.commands}
        aliasesWithDuplicates={model.aliasesWithDuplicates}
        showStudioPrompt={model.showStudioPrompt}
      />
    </Collapsible>
  </li>
))

export interface HooksModel {
  hooks: HookModel[]
  hookCount: { [name in HookName]: number }
  state: string
}

export interface HooksProps {
  state?: AppState
  model: HooksModel
}

const Hooks = observer(({ state = appState, model }: HooksProps) => (
  <ul className='hooks-container'>
    {_.map(model.hooks, (hook) => {
      if (hook.commands.length || (hook.isStudio && state.studioActive && model.state === 'passed')) {
        return <Hook key={hook.hookId} model={hook} showNumber={model.hookCount[hook.hookName] > 1} />
      }

      return null
    })}
  </ul>
))

export { Hook, HookHeader }

export default Hooks
