import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'

import { Expandable } from '../collapsible/expandable'
import { HookModel } from './hook-model'
import FileOpener from '../lib/file-opener'
import { indentPadding } from '../lib/util'
import { VirtualizableProps } from '../virtual-tree/virtualizable-types'
import { measureOnChange } from '../virtual-tree/virtualizable-util'

export interface HookProps {
  virtualizableProps: VirtualizableProps
  model: HookModel
  showNumber: boolean
}

export const Hook = observer(({ model, virtualizableProps }: HookProps) => {
  measureOnChange(virtualizableProps, () => {
    // list any observable properties that may affect the height or width
    // of the rendered DOM, in order to tell react-virtualized-tree
    // to re-measure when they change
    model.commands.length
    model.hookName
    model.hookNumber
  })

  if (!model.commands.length) return null

  const test = model.attempt.test
  const showNumber = model.attempt.hookCount[model.hookName] > 1
  const number = showNumber ? model.hookNumber : undefined

  return (
    <div className={cs(`hook runnable-state-${test.state}`, { 'hook-failed': model.failed })} style={indentPadding(virtualizableProps.style, test.level)}>
      <div className='hooks-container'>
        <div className='hook-item hook-header'>
          <Expandable virtualizableProps={virtualizableProps}>
            <div className='collapsible-header'>
              {model.hookName} {number && `(${number})`} <span className='hook-failed-message'>(failed)</span>
            </div>
          </Expandable>
          {model.invocationDetails && (
            <FileOpener fileDetails={model.invocationDetails} className='hook-open-in-ide'>
              <i className="fas fa-external-link-alt fa-sm" /> <span>Open in IDE</span>
            </FileOpener>
          )}
        </div>
      </div>
    </div>
  )
})
