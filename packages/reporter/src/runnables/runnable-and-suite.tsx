import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'

import { indent } from '../lib/util'

import Test from '../test/test'
import Collapsible from '../collapsible/collapsible'

import SuiteModel from './suite-model'
import TestModel from '../test/test-model'

interface SuiteProps {
  model: SuiteModel
}

const Suite = observer(({ model }: SuiteProps) => {
  if (!model.shouldRender) return null

  return (
    <Collapsible
      header={<span className='runnable-title'>{model.title}</span>}
      headerClass='runnable-wrapper'
      headerStyle={{ paddingLeft: indent(model.level) }}
      contentClass='runnables-region'
      isOpen={true}
    >
      <ul className='runnables'>
        {_.map(model.children, (runnable) => <Runnable key={runnable.id} model={runnable} />)}
      </ul>
    </Collapsible>
  )
})

export interface RunnableProps {
  model: TestModel | SuiteModel
}

const Runnable = observer(({ model }: RunnableProps) => (
  <li
    className={cs(`${model.type} runnable runnable-${model.state}`, {
      'runnable-retried': model.hasRetried,
    })}
  >
    {model.type === 'test' ? <Test model={model as TestModel} /> : <Suite model={model as SuiteModel} />}
  </li>
))

export { Suite }

export default Runnable
