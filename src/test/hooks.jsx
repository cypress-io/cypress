import _ from 'lodash'
import React from 'react'
import Command from './command'

const Hook = ({ model }) => (
  <li className='hook-item'>
    <span className='hook-name'>
    <i className='fa fa-caret-down'></i>
    {model.name}
    <span className='hook-failed hidden'>(failed)</span>
      <i className='fa fa-ellipsis-h hidden'></i>
    </span>
    <ul className='commands-container'>
      {_.map(model.commands, (command) => <Command key={command.id} model={command} />)}
    </ul>
  </li>
)

const Hooks = ({ model }) => (
  <ul className='hooks-container'>
    {_.map(model.hooks, (hook) => <Hook key={hook.id} model={hook} />)}
  </ul>
)

export default Hooks
