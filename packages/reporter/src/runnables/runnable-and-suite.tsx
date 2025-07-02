import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { MouseEvent, useCallback, useMemo } from 'react'

import appState, { AppState } from '../lib/app-state'
import events, { Events } from '../lib/events'
import Test from '../test/test'
import Collapsible, { CollapsibleHeaderComponentProps } from '../collapsible/collapsible'

import type SuiteModel from './suite-model'
import type TestModel from '../test/test-model'

import { IconActionAddMedium, IconChevronDownMedium, IconChevronRightMedium, IconObjectStackFailed, IconObjectStackPassed, IconObjectStackQueued, IconObjectStackRunning, IconObjectStackSkipped, WindiColor } from '@cypress-design/react-icon'
import Button from '@cypress-design/react-button'
import { RunnableArray } from './runnables-store'

// should only show connection dots if the current runnable is a test and the next runnable is a test and is not the last runnable
export const shouldShowConnectionDots = (runnables: RunnableArray, runnable: SuiteModel | TestModel, runnableIndex: number) => {
  return runnable.type === 'test' && runnableIndex !== runnables.length - 1 && runnables[runnableIndex + 1].type === 'test'
}

interface SuiteProps {
  eventManager?: Events
  model: SuiteModel
  studioEnabled: boolean
  canSaveStudioLogs: boolean
}

const headerIconDefaultProps = {
  fillColor: 'gray-900' as WindiColor,
  strokeColor: 'gray-500' as WindiColor,
  className: 'header-icon',
}

const Suite: React.FC<SuiteProps> = observer(({ eventManager = events, model, studioEnabled, canSaveStudioLogs }: SuiteProps) => {
  const _launchStudio = useCallback((e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    eventManager.emit('studio:init:suite', model.id)
  }, [eventManager, model.id])

  const getHeaderIcon = useCallback((isOpen: boolean) => {
    let headerIcon

    switch (model.state) {
      case 'active':
        headerIcon = <IconObjectStackRunning {...headerIconDefaultProps} />
        break
      case 'passed':
        headerIcon = <IconObjectStackPassed {...headerIconDefaultProps} secondaryStrokeColor='jade-400' />
        break
      case 'failed':
        headerIcon = <IconObjectStackFailed {...headerIconDefaultProps} secondaryStrokeColor='red-400' />
        break
      case 'pending':
        headerIcon = <IconObjectStackSkipped {...headerIconDefaultProps} />
        break
      case 'processing':
        headerIcon = <IconObjectStackQueued {...headerIconDefaultProps} />
        break
      default:
        headerIcon = <></>
        break
    }

    return <>
      {isOpen ? <IconChevronDownMedium className='header-collapsible-indicator' strokeColor='gray-700' /> : <IconChevronRightMedium size='16' className='header-collapsible-indicator' strokeColor='gray-700' />}
      {headerIcon}
    </>
  }, [model.state])

  const HeaderComponent = useCallback(({ isOpen }: CollapsibleHeaderComponentProps) => {
    return (
      <>
        <div className='runnable-and-suite-header-icon'>
          {getHeaderIcon(isOpen)}
        </div>
        <span className='runnable-title'>{model.title}</span>
        {(studioEnabled && !appState.studioActive) && (
          <>
            <Button data-cy='create-new-test-button' size='20' onClick={_launchStudio} variant='outline-dark' className={cs('launch-studio-button')} >
              <IconActionAddMedium strokeColor='gray-500' />
              New Test
            </Button>
            <span className='button-hover-shadow' />
          </>
        )}
      </>
    )
  }, [getHeaderIcon, model.title, studioEnabled, appState.studioActive, _launchStudio])

  const runnablesList = useMemo(() => (
    <ul className='runnables'>
      {_.map(model.children, (runnable, index) => {
        return (<Runnable
          key={runnable.id}
          model={runnable}
          studioEnabled={studioEnabled}
          canSaveStudioLogs={canSaveStudioLogs}
          shouldShowConnectingDots={shouldShowConnectionDots(model.children, runnable, index)}
        />)
      })}
    </ul>
  ), [model.children, studioEnabled, canSaveStudioLogs])

  return (
    // we don't want to show the collapsible if there are no tests in the suite
    model.children && !model.children.some((c) => c.type === 'test') ? runnablesList : (
      <Collapsible
        HeaderComponent={HeaderComponent}
        headerClass='runnable-wrapper'
        headerStyle={{}}
        hideExpander
        contentClass='runnables-region'
        isOpen
      >
        {runnablesList}
      </Collapsible>
    )
  )
})

Suite.displayName = 'Suite'

export interface RunnableProps {
  appState?: AppState
  model: TestModel | SuiteModel
  studioEnabled: boolean
  canSaveStudioLogs: boolean
  shouldShowConnectingDots: boolean
}

// NOTE: some of the driver tests dig into the React instance for this component
// in order to mess with its internal state. converting it to a functional
// component breaks that, so it needs to stay a Class-based component or
// else the driver tests need to be refactored to support it being functional
const Runnable: React.FC<RunnableProps> = observer(({ appState: appStateProps = appState, model, studioEnabled, canSaveStudioLogs, shouldShowConnectingDots }) => {
  return (<>
    <li
      className={cs(`${model.type} runnable runnable-${model.state}`, {
        'runnable-retried': model.hasRetried,
        'runnable-studio': appStateProps.studioActive,
        'last-test-margin-bottom': model.type === 'test' && !shouldShowConnectingDots,
      })}
      data-model-state={model.state}
    >
      {model.type === 'test'
        ? <Test model={model as TestModel} studioEnabled={studioEnabled} canSaveStudioLogs={canSaveStudioLogs} />
        : <Suite model={model as SuiteModel}
          studioEnabled={studioEnabled}
          canSaveStudioLogs={canSaveStudioLogs}
        />}
    </li>
    {shouldShowConnectingDots && <div className='runnable-dotted-line' />}
  </>
  )
})

Runnable.displayName = 'Runnable'

export { Suite }

export default Runnable
