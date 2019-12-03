import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import Command from '../commands/command'
import Collapsible from '../collapsible/collapsible'
import HookModel from './hook-model'

export interface HookHeaderProps {
  name: string
}

const HookHeader = ({ name }: HookHeaderProps) => (
  <span>
    {name} <span className='hook-failed-message'>(failed)</span>
  </span>
)

export interface HookProps {
  model: HookModel
}

const Hook = observer(({ model }: HookProps) => (
  <li className={cs('hook-item', { 'hook-failed': model.failed })}>
    <Collapsible
      header={<HookHeader name={model.name} />}
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
}

export interface HooksProps {
  model: HooksModel
}

const Hooks = observer(({ model }: HooksProps) => (
  <ul className='hooks-container'>
    {_.map(model.hooks, (hook) => <Hook key={hook.id} model={hook} />)}
  </ul>
))

export { Hook, HookHeader }

export default Hooks
