import _ from 'lodash'
import cs from 'classnames'
import React from 'react'
import Tooltip from 'rc-tooltip'

const displayName = (model) => model.displayName || model.name
const isParent = (model) => model.type === 'parent'
const truncatedMessage = (message) => message ? _.truncate(message, { length: 100 }) : ''
const visibleMessage = (model) => {
  if (model.visible) return ''

  return model.numElements > 1 ?
    'One or more matched elements are not visible.' :
    'This element is not visible.'
}

const Alias = ({ model }) => (
  <Tooltip placement='top' align={{ offset: [0, 5] }} overlay={`Found an alias for: '${model.referencesAlias}'`}>
    <span className={`command-alias ${model.aliasType}`}>@{model.referencesAlias}</span>
  </Tooltip>
)

export default ({ model }) => (
  <li
    className={cs(
      `command-type-${model.type}`,
      `command-name-${displayName(model)}`,
      `command-state-${model.state}`,
      {
        'command-is-event': !!model.event,
        'command-is-parent': isParent(model),
        'command-is-child': !isParent(model),
        'command-is-alias': !!model.alias,
        'command-is-invisible': !model.visible,
        'command-has-num-elements': model.numElements != null,
        'command-has-no-elements': !model.numElements,
        'command-has-multiple-elements': model.numElements > 1,
      }
    )}
  >
    <div className='command-wrapper'>
      <span className='command-number'>
        <i className='fa fa-spinner fa-spin'></i>
        <span>{model.number || ''}</span>
      </span>
      <span className='command-method' style={{ paddingLeft: model.indent }}>
        <span>{model.event ? `(${displayName(model)})` :  displayName(model)}</span>
      </span>
      <span className='command-message'>
        {model.referencesAlias ? <Alias model={model} /> : truncatedMessage(model.message)}
      </span>
      <span className='command-controls'>
        <Tooltip placement='left' align={{ offset: [5, 0] }} overlay={`${model.message} aliased as: '${model.alias}'`}>
          <span className={`command-alias ${model.aliasType}`}>{model.alias}</span>
        </Tooltip>
        <Tooltip placement='left' align={{ offset: [5, 0] }} overlay={visibleMessage(model)}>
          <i className='command-invisible fa fa-eye-slash'></i>
        </Tooltip>
        <Tooltip placement='left' align={{ offset: [5, 0] }} overlay={`${model.numElements} matched elements`}>
          <span className='command-num-elements'>{model.numElements}</span>
        </Tooltip>
      </span>
    </div>
  </li>
)
