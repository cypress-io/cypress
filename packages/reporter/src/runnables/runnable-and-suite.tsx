import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { Component, MouseEvent } from 'react'

import { indent } from '../lib/util'

import appState, { AppState } from '../lib/app-state'
import events, { Events } from '../lib/events'
import Test from '../test/test'
import Collapsible from '../collapsible/collapsible'

import type SuiteModel from './suite-model'
import type TestModel from '../test/test-model'

import { LaunchStudioIcon } from '../components/LaunchStudioIcon'

interface SuiteProps {
  eventManager?: Events
  model: SuiteModel
  studioEnabled: boolean
  canSaveStudioLogs: boolean
}

const Suite = observer(({ eventManager = events, model, studioEnabled, canSaveStudioLogs }: SuiteProps) => {
  const _launchStudio = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    eventManager.emit('studio:init:suite', model.id)
  }

  const _header = () => (
    <>
      <span className='runnable-title'>{model.title}</span>
      {(studioEnabled && !appState.studioActive) && (
        <span className='runnable-controls'>
          <LaunchStudioIcon
            title='Add New Test'
            onClick={_launchStudio}
          />
        </span>
      )}
    </>
  )

  return (
    <Collapsible
      header={_header()}
      headerClass='runnable-wrapper'
      headerStyle={{ paddingLeft: indent(model.level) }}
      contentClass='runnables-region'
      isOpen
    >
      <ul className='runnables'>
        {_.map(model.children, (runnable) =>
          (<Runnable
            key={runnable.id}
            model={runnable}
            studioEnabled={studioEnabled}
            canSaveStudioLogs={canSaveStudioLogs}
          />))}
      </ul>
    </Collapsible>
  )
})

export interface RunnableProps {
  model: TestModel | SuiteModel
  appState: AppState
  studioEnabled: boolean
  canSaveStudioLogs: boolean
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
    const { appState, model, studioEnabled, canSaveStudioLogs } = this.props

    return (
      <li
        className={cs(`${model.type} runnable runnable-${model.state}`, {
          'runnable-retried': model.hasRetried,
          'runnable-studio': appState.studioActive,
        })}
        data-model-state={model.state}
      >
        {model.type === 'test'
          ? <Test model={model as TestModel} studioEnabled={studioEnabled} canSaveStudioLogs={canSaveStudioLogs} />
          : <Suite model={model as SuiteModel} studioEnabled={studioEnabled} canSaveStudioLogs={canSaveStudioLogs} />}
      </li>
    )
  }
}

export { Suite }

export default Runnable
