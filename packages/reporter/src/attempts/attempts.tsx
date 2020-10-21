import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { useEffect } from 'react'
import { FlattenedNode } from 'react-virtualized-tree'

import { AttemptModel } from './attempt-model'
import { VirtualExpandable, ExpandableProps } from '../collapsible/expandable'

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
  style: React.CSSProperties
  expandableProps: ExpandableProps
  // scrollIntoView: Function
}

export const Attempt = observer(({ model, style, expandableProps }: AttemptProps) => {
  useEffect(() => {
    // scrollIntoView()
    requestAnimationFrame(() => {
      // FIXME: can't do this, it causes a render loop
      expandableProps.measure()
    })
  }, [true])

  // QUESTION: is this still necessary? can it be done without a hack?
  // HACK: causes component update when command log is added
  model.commands.length

  if (!model.test.hasMultipleAttempts || model.hasCommands) {
    return <div className='attempt'></div>
  }

  return (
    <VirtualExpandable {...expandableProps}>
      <div
        key={model.id}
        className={cs('attempt', `attempt-state-${model.state}`, {
          'attempt-failed': model.state === 'failed',
          'show': model.test.hasMultipleAttempts,
        })}
        style={style}
      >
        <div className='attempt-header'>
          <div className='attempt-tag'>
            <div className='open-close-indicator'>
              <i className='fa fa-fw fa-angle-up' />
              <i className='fa fa-fw fa-angle-down' />
            </div>
            Attempt {model.index + 1}
            <i className="attempt-state fa fa-fw" />
          </div>
        </div>
        {!model.hasCommands && <NoCommands />}
      </div>
    </VirtualExpandable>
  )
})
