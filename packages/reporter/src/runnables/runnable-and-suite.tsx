import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import { indentPadding } from '../lib/util'
import { SuiteModel } from './suite-model'
import { TestModel } from '../test/test-model'

import { Expandable } from '../collapsible/expandable'
import { Test } from '../test/test'
import { VirtualizableProps } from '../tree/virtualizable-types'

interface SuiteProps {
  model: SuiteModel
  style?: React.CSSProperties
}

export const Suite = observer(({ model }: SuiteProps) => {
  if (!model.shouldRender) return null

  return (
    <div className='runnable-title'>
      {model.title}
    </div>
  )
})

export interface RunnableProps {
  model: TestModel | SuiteModel
  virtualizableProps: VirtualizableProps
}

// NOTE: some of the driver tests dig into the React instance for this component
// in order to mess with its internal state. converting it to a functional
// component breaks that, so it needs to stay a Class-based component or
// else the driver tests need to be refactored to support it being functional
@observer
export class Runnable extends Component<RunnableProps> {
  render () {
    const { model, virtualizableProps } = this.props

    return (
      <div
        className={`${model.type} runnable runnable-state-${model.state}`}
        style={indentPadding(virtualizableProps.style, model.level)}
      >
        <Expandable virtualizableProps={virtualizableProps}>
          {model.type === 'test' ? <Test model={model as TestModel} /> : <Suite model={model as SuiteModel} />}
        </Expandable>
      </div>
    )
  }
}
