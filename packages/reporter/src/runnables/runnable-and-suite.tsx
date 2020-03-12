import cs from 'classnames'
import _ from 'lodash'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component, MouseEvent } from 'react'

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

@observer
class Runnable extends Component<RunnableProps> {
  @observable isHovering = false

  render () {
    const { model } = this.props

    return (
      <li
        className={cs(`${model.type} runnable runnable-${model.state}`, {
          'runnable-retried': model.hasRetried,
          hover: this.isHovering,
        })}
        onMouseOver={this._hover(true)}
        onMouseOut={this._hover(false)}
      >
        {model.type === 'test' ? <Test model={model as TestModel} /> : <Suite model={model as SuiteModel} />}
      </li>
    )
  }

  _hover = (shouldHover: boolean) => action('runnable:hover', (e: MouseEvent) => {
    e.stopPropagation()
    this.isHovering = shouldHover
  })
}

export { Suite }

export default Runnable
