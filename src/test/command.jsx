import _ from 'lodash'
import cs from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'
import Markdown from 'markdown-it'

const md = new Markdown()

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
  <span className={`command-alias ${model.aliasType}`} title={`Found an alias for: '${model.referencesAlias}'`}>
    @{model.referencesAlias}
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
        {model.referencesAlias ?
          <Alias model={model} /> :
          <span dangerouslySetInnerHTML={{ __html: formattedMessage(model.message) }} />}
      </span>
      <span className='command-controls'>
        <span className={`command-alias ${model.aliasType}`} title={`${model.message} aliased as: '${model.alias}'`}>
          {model.alias}
        </span>
        <i className='command-invisible fa fa-eye-slash' title={visibleMessage(model)}></i>
        <span className='command-num-elements' title={`${model.numElements} matched elements`}>
          {model.numElements}
        </span>
      </span>
    </div>
  </li>
))

export default Command
