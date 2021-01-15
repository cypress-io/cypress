import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { Component, MouseEvent } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import { indent } from '../lib/util'

import appState, { AppState } from '../lib/app-state'
import events, { Events } from '../lib/events'
import Test from '../test/test'
import Collapsible from '../collapsible/collapsible'

import SuiteModel from './suite-model'
import TestModel from '../test/test-model'

interface SuiteProps {
  eventManager?: Events
  model: SuiteModel
}

const Suite = observer(({ eventManager = events, model }: SuiteProps) => {
  if (!model.shouldRender) return null

  const _launchStudio = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    eventManager.emit('studio:init:suite', model.id)
  }

  const _header = () => (
    <>
      <span className='runnable-title'>{model.title}</span>
      <span className='runnable-controls'>
        <Tooltip placement='right' title='Add New Test' className='cy-tooltip'>
          <a onClick={_launchStudio} className='runnable-controls-studio'>
            <i className='fas fa-magic' />
          </a>
        </Tooltip>
      </span>
    </>
  )

  return (
    <Collapsible
      header={_header()}
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
  appState: AppState
}

// NOTE: some of the driver tests dig into the React instance for this component
// in order to mess with its internal state. converting it to a functional
// component breaks that, so it needs to stay a Class-based component or
// else the driver tests need to be refactored to support it being functional
@observer
class Runnable extends Component<RunnableProps> {
  static defaultProps = {
    appState,
  }

  render () {
    const { appState, model } = this.props

    return (
      <li
        className={cs(`${model.type} runnable runnable-${model.state}`, {
          'runnable-retried': model.hasRetried,
          'runnable-studio': appState.studioActive,
        })}
      >
        {model.type === 'test' ? <Test model={model as TestModel} /> : <Suite model={model as SuiteModel} />}
      </li>
    )
  }
}

export { Suite }

export default Runnable
