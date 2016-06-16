import _ from 'lodash'
import React from 'react'
import Command from './command'

export default ({ model }) => (
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
