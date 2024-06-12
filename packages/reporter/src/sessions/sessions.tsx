import cs from 'classnames'
import React from 'react'
import { observer } from 'mobx-react'
import GlobeIcon from '@packages/frontend-shared/src/assets/icons/globe_x12.svg'

import SessionsModel from './sessions-model'
import events from '../lib/events'
import Collapsible from '../collapsible/collapsible'
import Tag from '../lib/tag'
import FlashOnClick from '../lib/flash-on-click'

export interface SessionPanelProps {
  model: Record<string, SessionsModel>
}

const SessionRow = (model: SessionsModel) => {
  const { name, isGlobalSession, id, status, testId } = model

  const printToConsole = (id) => {
    events.emit('show:command', testId, id)
  }

  return (
    <FlashOnClick
      key={name}
      message='Printed output to your console'
      onClick={() => printToConsole(id)}
      shouldShowMessage={() => true}
      wrapperClassName='session-item-wrapper'
    >
      <div className='session-item'>
        <span className={cs('session-info', { 'spec-session': !isGlobalSession })}>
          {isGlobalSession && <GlobeIcon className='global-session-icon' />}
          {name}
        </span>
        <Tag
          customClassName='session-status'
          content={status}
          type={model.tagType}
        />
      </div>
    </FlashOnClick>
  )
}

const Sessions = ({ model }: SessionPanelProps) => {
  const sessions = Object.values(model)

  if (sessions.length === 0) {
    return null
  }

  return (
    <ul className='instruments-container hooks-container sessions-container'>
      <li className='hook-item'>
        <Collapsible
          header={<>Sessions <i style={{ textTransform: 'none' }}>({sessions.length})</i></>}
          headerClass='hook-header'
          headerExtras={
            <div
              className="clear-sessions"
              onClick={() => events.emit('clear:all:sessions')}
            >
              <span><i className="fas fa-ban" /> Clear All Sessions</span>
            </div>
          }
          contentClass='instrument-content session-content'
        >
          {sessions.map((session) => (<SessionRow key={session.id} {...session} />))}
        </Collapsible>
      </li>
    </ul>
  )
}

export default observer(Sessions)
