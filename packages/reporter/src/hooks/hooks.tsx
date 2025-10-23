import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import appState, { AppState } from '../lib/app-state'
import Command from '../commands/command'
import Collapsible from '../collapsible/collapsible'
import type HookModel from './hook-model'
import type { HookName } from './hook-model'
import { OpenFileInIDEButton } from '../header/OpenFileInIDEButton'

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

export interface HookProps {
  model: HookModel
  showNumber: boolean
  scrollIntoView: Function
}

const Hook: React.FC<HookProps> = observer(({ model, showNumber, scrollIntoView }: HookProps) => (
  <li className={cs('hook-item', { 'hook-failed': model.failed })}>
    <Collapsible
      header={
        <>
          <HookHeader model={model} number={showNumber ? model.hookNumber : undefined} />
          {model.invocationDetails && Cypress.testingType !== 'component' && (
            <span onClick={(e) => e.stopPropagation()}>
              <OpenFileInIDEButton fileDetails={model.invocationDetails} className='hook-open-in-ide' />
            </span>
          )}
        </>
      }
      headerClass='hook-header'
      isOpen
    >
      <ul className='commands-container'>
        {_.map(model.commands, (command) => <Command key={command.id} model={command} aliasesWithDuplicates={model.aliasesWithDuplicates} scrollIntoView={scrollIntoView} />)}
      </ul>
    </Collapsible>
  </li>
))

Hook.displayName = 'Hook'

export interface HooksModel {
  hooks: HookModel[]
  hookCount: { [name in HookName]: number }
  state: string
}

export interface HooksProps {
  state?: AppState
  model: HooksModel
  scrollIntoView: Function
}

const Hooks: React.FC<HooksProps> = observer(({ state = appState, model, scrollIntoView }: HooksProps) => (
  <ul className='hooks-container'>
    {_.map(model.hooks, (hook) => {
      if (hook.commands.length && hook.hookName !== 'studio commands') {
        return <Hook key={hook.hookId} model={hook} scrollIntoView={scrollIntoView} showNumber={model.hookCount[hook.hookName] > 1} />
      }

      return null
    })}
  </ul>
))

Hooks.displayName = 'Hooks'

export { Hook, HookHeader }

export default Hooks
