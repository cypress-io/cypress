import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import Command from '../commands/command'
import Collapsible from '../collapsible/collapsible'
import HookModel from './hook-model'

const getHookName = (name: string) => {
  return name.replace(/ \([0-9]+\)/, '')
}

export interface HookHeaderProps {
  name: string
  showCount: boolean
}

const HookHeader = ({ name, showCount }: HookHeaderProps) => (
  <span>
    {showCount ? name : getHookName(name)} <span className='hook-failed-message'>(failed)</span>
  </span>
)

export interface HookProps {
  model: HookModel
  showCount: boolean
}

const Hook = observer(({ model, showCount }: HookProps) => (
  <li className={cs('hook-item', { 'hook-failed': model.failed })}>
    <Collapsible
      header={<HookHeader name={model.name} showCount={showCount} />}
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

const Hooks = observer(({ model }: HooksProps) => {
  const hooksCount: { [key: string]: number } = {
    'before all': 0,
    'before each': 0,
    'after all': 0,
    'after each': 0,
  }

  _.map(model.hooks, (hook) => hook.name !== 'test' && hooksCount[getHookName(hook.name)]++)

  return (
    <ul className='hooks-container'>
      {_.map(model.hooks, (hook) => <Hook key={hook.id} model={hook} showCount={hooksCount[getHookName(hook.name)] > 1} />)}
    </ul>
  )
})

export { Hook, HookHeader }

export default Hooks
