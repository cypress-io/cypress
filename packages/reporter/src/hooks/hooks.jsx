import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import Command from '../commands/command'
import Collapsible from '../collapsible/collapsible'

const HookHeader = ({ name }) => (
  <span>
    {name} <span className='hook-failed-message'>(failed)</span>
  </span>
)

const Hook = observer(({ model }) => (
  <li className={cs('hook-item', { 'hook-failed': model.failed })}>
    <Collapsible
      header={<HookHeader name={model.name} />}
      headerClass='hook-name'
      isOpen={true}
    >
      <ul className='commands-container'>
        {_.map(model.commands, (command) => <Command key={command.id} model={command} />)}
      </ul>
    </Collapsible>
  </li>
))

const Hooks = observer(({ model }) => (
  <ul className='hooks-container'>
    {_.map(model.hooks, (hook) => <Hook key={hook.id} model={hook} />)}
  </ul>
))

export { Hook, HookHeader }

export default Hooks
