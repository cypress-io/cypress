import cs from 'classnames'
import { observer } from 'mobx-react'
import React, { useEffect, useState } from 'react'

import type { TestState } from '@packages/types'
import Agents from '../agents/agents'
import Collapsible from '../collapsible/collapsible'
import Hooks from '../hooks/hooks'
import Routes from '../routes/routes'
import TestError from '../errors/test-error'
import type TestModel from '../test/test-model'
import type AttemptModel from './attempt-model'
import Sessions from '../sessions/sessions'

import CollapseIcon from '@packages/frontend-shared/src/assets/icons/collapse_x16.svg'
import ExpandIcon from '@packages/frontend-shared/src/assets/icons/expand_x16.svg'
import StateIcon from '../lib/state-icon'

const NoCommands = () => (
  <ul className='hooks-container'>
    <li className='no-commands'>
      No commands were issued in this test.
    </li>
  </ul>
)

const AttemptHeader = ({ index, state }: {index: number, state: TestState }) => (
  <span className='attempt-tag'>
    <span className='open-close-indicator'>
      <CollapseIcon className='collapse-icon' />
      <ExpandIcon className='expand-icon' />
    </span>
    Attempt {index + 1}
    <StateIcon state={state} className="attempt-state" />
  </span>
)

interface AttemptProps {
  model: AttemptModel
  scrollIntoView: Function
  studioActive: boolean
}

const Attempt: React.FC<AttemptProps> = observer(({ model, scrollIntoView, studioActive }) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (isMounted) {
      scrollIntoView()
    } else {
      setIsMounted(true)
    }
  })

  return (
    <li
      key={model.id}
      className={cs('attempt-item', `attempt-state-${model.state}`)}
    >
      <Collapsible
        header={<AttemptHeader index={model.id} state={model.state} />}
        hideExpander
        headerClass='attempt-name'
        contentClass='attempt-content'
        isOpen={model.isOpen}
        onOpenStateChangeRequested={(isOpen: boolean) => model.setIsOpen(isOpen)}
      >
        <div className={`attempt-${model.id + 1}`}>
          <Sessions model={model.sessions} />
          <Agents model={model} />
          <Routes model={model} />
          <div className='runnable-commands-region'>
            {model.hasCommands ? <Hooks model={model} /> : <NoCommands />}
          </div>
          {model.state === 'failed' && (
            <div className='attempt-error-region'>
              <TestError {...model.error} />
              {studioActive && (
                <div className='runnable-err-wrapper studio-err-wrapper'>
                  <div className='runnable-err'>
                    <div className='runnable-err-message'>
                      Studio cannot add commands to a failing test.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Collapsible>
    </li>
  )
})

const Attempts = observer(({ test, scrollIntoView, studioActive }: {test: TestModel, scrollIntoView: Function, studioActive: boolean}) => {
  return (<ul className={cs('attempts', {
    'has-multiple-attempts': test.hasMultipleAttempts,
  })}>
    {test.attempts.map((attempt) => {
      return (
        <Attempt
          key={attempt.id}
          scrollIntoView={scrollIntoView}
          studioActive={studioActive}
          model={attempt}
        />
      )
    })}
  </ul>)
})

export { Attempt, AttemptHeader, NoCommands }

export default Attempts
