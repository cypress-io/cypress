import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'

import { indentPadding } from '../lib/util'
import { SuiteModel } from './suite-model'
import { TestModel } from '../test/test-model'

import { Expandable, ExpandableProps } from '../collapsible/expandable'
import { Test } from '../test/test'

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
  style: React.CSSProperties
  expandableProps: ExpandableProps
}

export const Runnable = observer(({ model, style = {}, expandableProps }: RunnableProps) => (
  <div
    className={`${model.type} runnable runnable-state-${model.state}`}
    style={indentPadding(style, model.level)}
  >
    <Expandable expandableProps={expandableProps}>
      {model.type === 'test' ? <Test model={model as TestModel} /> : <Suite model={model as SuiteModel} />}
    </Expandable>
  </div>
))
