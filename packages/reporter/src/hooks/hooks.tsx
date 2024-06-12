import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import { FileDetails } from '@packages/types'

import appState, { AppState } from '../lib/app-state'
import Command from '../commands/command'
import Collapsible from '../collapsible/collapsible'
import HookModel, { HookName } from './hook-model'

import ArrowRightIcon from '@packages/frontend-shared/src/assets/icons/arrow-right_x16.svg'
import OpenIcon from '@packages/frontend-shared/src/assets/icons/technology-code-editor_x16.svg'
import OpenFileInIDE from '../lib/open-file-in-ide'

export interface HookHeaderProps {
  model: HookModel
  number?: number
}

const HookHeader = ({ model, number }: HookHeaderProps) => (
  <span className='hook-name' data-cy={`hook-name-${model.hookName}`}>
    {model.hookName} {number && `(${number})`}
    {model.failed && <span className='hook-failed-message'> (failed)</span>}
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

const StudioNoCommands = () => (
  <li className='command command-name-get command-state-pending command-type-parent studio-prompt'>
    <span>
      <div className='command-wrapper'>
        <div className='command-wrapper-text'>
          <span className='command-message'>
            <span className='command-message-text'>
              Interact with your site to add test commands. Right click to add assertions.
            </span>
          </span>
          <span className='command-controls'>
            <ArrowRightIcon />
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
      headerExtras={model.invocationDetails && Cypress.testingType !== 'component' && <HookOpenInIDE invocationDetails={model.invocationDetails} />}
      isOpen
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
