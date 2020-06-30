import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import Command from '../commands/command'
import Collapsible from '../collapsible/collapsible'
import HookModel, { HookName } from './hook-model'

export interface HookHeaderProps {
  name: string
  number?: number
}

const HookHeader = ({ name, number }: HookHeaderProps) => (
  <span>
    {name} {number && `(${number})`} <span className='hook-failed-message'>(failed)</span>
  </span>
)

export interface HookProps {
  model: HookModel
  showNumber: boolean
}

const Hook = observer(({ model, showNumber }: HookProps) => (
  <li className={cs('hook-item', { 'hook-failed': model.failed })}>
    <Collapsible
      header={<HookHeader name={model.hookName} number={showNumber ? model.hookNumber : undefined} />}
      headerClass='hook-name'
      isOpen={true}
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
}

export interface HooksProps {
  model: HooksModel
}

const Hooks = observer(({ model }: HooksProps) => (
  <ul className='hooks-container'>
    {_.map(model.hooks, (hook) => hook.commands.length ? <Hook key={hook.hookId} model={hook} showNumber={model.hookCount[hook.hookName] > 1} /> : undefined)}
  </ul>
))

export { Hook, HookHeader }

export default Hooks
