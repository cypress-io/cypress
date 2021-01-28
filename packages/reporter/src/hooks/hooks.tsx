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
}

const HookHeader = ({ model, number }: HookHeaderProps) => (
  <span className='hook-name'>
    {model.hookName} {number && `(${number})`} <span className='hook-failed-message'>(failed)</span>
  </span>
)

export interface HookOpenInIDEProps {
  invocationDetails: FileDetails
}

const HookOpenInIDE = ({ invocationDetails }: HookOpenInIDEProps) => (
  <FileOpener fileDetails={invocationDetails} className='hook-open-in-ide'>
    <i className='fas fa-external-link-alt fa-sm' /> <span>Open in IDE</span>
  </FileOpener>
)

const StudioNoCommands = () => (
  <li className='command command-name-get command-state-pending command-type-parent studio-prompt'>
    <span>
      <div className='command-wrapper'>
        <div className='command-wrapper-text'>
          <span className='command-message'>
            <span className='command-message-text'>
              Interact with your site to add test commands.
            </span>
          </span>
          <span className='command-controls'>
            <i className='fa fa-arrow-right' />
          </span>
        </div>
      </div>
    </span>
  </li>
)

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
      <ul className='commands-container'>
        {_.map(model.commands, (command) => <Command key={command.id} model={command} aliasesWithDuplicates={model.aliasesWithDuplicates} />)}
        {model.showStudioPrompt && <StudioNoCommands />}
      </ul>
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
