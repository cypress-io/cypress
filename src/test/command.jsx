import _ from 'lodash'
import cs from 'classnames'
import Markdown from 'markdown-it'
import { observer } from 'mobx-react'
import React from 'react'

import events from '../lib/events'
import Tooltip from '../lib/tooltip'
import FlashOnClick from '../lib/flash-on-click'

const md = new Markdown()

// TODO: move to command model?
const displayName = (model) => model.displayName || model.name
const isParent = (model) => model.type === 'parent'
const formattedMessage = (message) => message ? md.renderInline(_.truncate(message, { length: 100 })) : ''
const visibleMessage = (model) => {
  if (model.visible) return ''

  return model.numElements > 1 ?
    'One or more matched elements are not visible.' :
    'This element is not visible.'
}

const Alias = observer(({ model }) => (
  <Tooltip placement='top' title={`Found an alias for: '${model.referencesAlias}'`}>
    <span className={`command-alias ${model.aliasType}`}>@{model.referencesAlias}</span>
  </Tooltip>
))

const Message = observer(({ model }) => (
  <span>
    <i className={`fa fa-circle ${model.indicator}`}></i>
    <span dangerouslySetInnerHTML={{ __html: formattedMessage(model.displayMessage || model.message) }} />
  </span>
))

const Command = observer(({ model }) => (
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
        'command-is-invisible': model.visible != null && !model.visible,
        'command-has-num-elements': model.numElements != null,
        'command-has-no-elements': !model.numElements,
        'command-has-multiple-elements': model.numElements > 1,
        'command-with-indicator': !!model.indicator,
      }
    )}
  >
    <FlashOnClick
      message='Printed output to your console!'
      onClick={() => events.emit('show:command', model.id)}
    >
      <div className='command-wrapper'>
        <span className='command-number'>
          <i className='fa fa-spinner fa-spin'></i>
          <span>{model.number || ''}</span>
        </span>
        <span className='command-method'>
          <span>{model.event ? `(${displayName(model)})` :  displayName(model)}</span>
        </span>
        <span className='command-message'>
          {model.referencesAlias ? <Alias model={model} /> : <Message model={model} />}
        </span>
        <span className='command-controls'>
          <Tooltip placement='left' title={`${model.message} aliased as: '${model.alias}'`}>
            <span className={`command-alias ${model.aliasType}`}>{model.alias}</span>
          </Tooltip>
          <Tooltip placement='left' title={visibleMessage(model)}>
            <i className='command-invisible fa fa-eye-slash'></i>
          </Tooltip>
          <Tooltip placement='left' title={`${model.numElements} matched elements`}>
            <span className='command-num-elements'>{model.numElements}</span>
          </Tooltip>
        </span>
      </div>
    </FlashOnClick>
  </li>
))

export default Command
