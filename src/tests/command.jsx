import cs from 'classnames'
import React from 'react'

const displayName = (model) => model.displayName || model.name
const isParent = (model) => model.type === 'parent'

export default ({ model }) => (
  <li
    className={cs(`command-type-${model.type}`, `model-name-${displayName(model)}`, {
      'command-event': !!model.event,
      'command-parent': isParent(model),
      'command-child': !isParent(model),
    })}
  >
    <div className='command-wrapper'>
      <span className='command-number'>
        <span>{model.number || ''}</span>
      </span>
      <span className='command-method' style={{ paddingLeft: 0 }}>
        <span>{model.event ? `(${displayName(model)})` :  displayName(model)}</span>
      </span>
      <span className='command-message'>
        <span>{model.message}</span>
      </span>
      <span className='command-controls'></span>
    </div>
  </li>
)
