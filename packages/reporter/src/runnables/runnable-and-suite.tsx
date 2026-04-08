import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { useCallback, useMemo } from 'react'

import appState from '../lib/app-state'
import events, { Events } from '../lib/events'
import Test from '../test/test'
import Collapsible, { CollapsibleHeaderComponentProps } from '../collapsible/collapsible'

import type SuiteModel from './suite-model'
import type TestModel from '../test/test-model'

import { IconChevronDownMedium, IconChevronRightMedium, IconObjectStackFailed, IconObjectStackPassed, IconObjectStackQueued, IconObjectStackRunning, IconObjectStackSkipped, WindiColor } from '@cypress-design/react-icon'
import { RunnableArray } from './runnables-store'
import { CreateNewTestButton } from '../header/CreateNewTestButton'

// should only show connection dots if the current runnable is a test and the next runnable is a test and is not the last runnable
export const shouldShowConnectionDots = (runnables: RunnableArray, runnable: SuiteModel | TestModel, runnableIndex: number) => {
  return runnable.type === 'test' && runnableIndex !== runnables.length - 1 && runnables[runnableIndex + 1].type === 'test'
}

interface SuiteProps {
  eventManager?: Events
  model: SuiteModel
  studioEnabled: boolean
  spec?: Cypress.Cypress['spec']
}

const headerIconDefaultProps = {
  fillColor: 'gray-900' as WindiColor,
  strokeColor: 'gray-500' as WindiColor,
  className: 'header-icon',
}

const Suite: React.FC<SuiteProps> = observer(({ eventManager = events, model, studioEnabled, spec }: SuiteProps) => {
  const headerIconStyle = {
    marginTop: '1px',
  }

  const getHeaderIcon = useCallback((isOpen: boolean) => {
    let headerIcon

    switch (model.state) {
      case 'active':
        headerIcon = <IconObjectStackRunning {...headerIconDefaultProps} style={headerIconStyle} />
        break
      case 'passed':
        headerIcon = <IconObjectStackPassed {...headerIconDefaultProps} secondaryStrokeColor='jade-400' style={headerIconStyle} />
        break
      case 'failed':
        headerIcon = <IconObjectStackFailed {...headerIconDefaultProps} secondaryStrokeColor='red-400' style={headerIconStyle} />
        break
      case 'pending':
        headerIcon = <IconObjectStackSkipped {...headerIconDefaultProps} style={headerIconStyle} />
        break
      case 'processing':
        headerIcon = <IconObjectStackQueued {...headerIconDefaultProps} style={headerIconStyle} />
        break
      default:
        headerIcon = <></>
        break
    }

    return <>
      {isOpen ? <IconChevronDownMedium className='header-collapsible-indicator' strokeColor='gray-700' style={headerIconStyle} /> : <IconChevronRightMedium size='16' className='header-collapsible-indicator' strokeColor='gray-700' style={headerIconStyle} />}
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
        {(studioEnabled && !appState.studioActive && spec?.relative !== '__all') && (
          <>
            <CreateNewTestButton suiteId={model.id} dataCy='create-new-test-from-suite' />
            <span className='button-hover-shadow' />
          </>
        )}
      </>
    )
  }, [getHeaderIcon, model.title, studioEnabled, appState.studioActive])

  const runnablesList = useMemo(() => (
    <ul className='runnables'>
      {_.map(model.children, (runnable, index) => {
        return (<Runnable
          key={runnable.id}
          model={runnable}
          studioEnabled={studioEnabled}
          shouldShowConnectingDots={shouldShowConnectionDots(model.children, runnable, index)}
          spec={spec}
        />)
      })}
    </ul>
  ), [model.children, studioEnabled])

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

interface RunnableComponentProps {
  model: TestModel | SuiteModel
  studioEnabled: boolean
  shouldShowConnectingDots: boolean
  spec?: Cypress.Cypress['spec']
}

// NOTE: some of the driver tests dig into the React instance for this component
// in order to mess with its internal state. converting it to a functional
// component breaks that, so it needs to stay a Class-based component or
// else the driver tests need to be refactored to support it being functional
const Runnable: React.FC<RunnableComponentProps> = observer(({ model, studioEnabled, shouldShowConnectingDots, spec }) => {
  return (<>
    <li
      className={cs(`${model.type} runnable runnable-${model.state}`, {
        'runnable-retried': model.hasRetried,
        'last-test-margin-bottom': model.type === 'test' && !shouldShowConnectingDots,
      })}
      data-model-state={model.state}
    >
      {model.type === 'test'
        ? <Test model={model as TestModel} studioEnabled={studioEnabled} spec={spec}/>
        : <Suite model={model as SuiteModel}
          studioEnabled={studioEnabled}
          spec={spec}
        />}
    </li>
    {shouldShowConnectingDots && <div className='runnable-dotted-line' />}
  </>
  )
})

Runnable.displayName = 'Runnable'

export default Runnable
