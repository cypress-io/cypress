import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { useEffect } from 'react'

import { AttemptModel } from './attempt-model'
import { Expandable } from '../collapsible/expandable'
import { indentPadding } from '../lib/util'
import { VirtualizableProps } from '../virtual-tree/virtualizable-types'
import { measureOnChange } from '../virtual-tree/virtualizable-util'

// TODO:
// - handle scrollIntoView
// - use model.isOpen for expandable?
// - does NoCommands work properly?

const NoCommands = () => (
  <div className='no-commands'>
    No commands were issued in this test.
  </div>
)

interface AttemptProps {
  model: AttemptModel
  virtualizableProps: VirtualizableProps
  // scrollIntoView: Function
}

export const Attempt = observer(({ model, virtualizableProps }: AttemptProps) => {
  measureOnChange(virtualizableProps, () => {
    // list any observable properties that may affect the height or width
    // of the rendered DOM, in order to tell react-virtualized-tree
    // to re-measure when they change
    model.test.hasMultipleAttempts
    model.hasCommands
    model.state
    model.index
    model.commands.length
  })

  useEffect(() => {
    // scrollIntoView()
  }, [true])

  // QUESTION: is this still necessary? can it be done without a hack?
  // HACK: causes component update when command log is added
  model.commands.length

  return (
    <div
      className={cs('attempt', `runnable-state-${model.test.state}`, `attempt-state-${model.state}`, {
        'show': model.test.hasMultipleAttempts && model.hasCommands,
      })}
      style={indentPadding(virtualizableProps.style, model.test.level)}
    >
      <div className='attempt-header'>
        <Expandable virtualizableProps={virtualizableProps}>
          <div className='attempt-tag'>
            <div className='open-close-indicator'>
              <i className='fa fa-fw fa-angle-up' />
              <i className='fa fa-fw fa-angle-down' />
            </div>
            Attempt {model.index + 1}
            <i className="attempt-state fa fa-fw" />
          </div>
        </Expandable>
      </div>
      {!model.hasCommands && <NoCommands />}
    </div>
  )
})
