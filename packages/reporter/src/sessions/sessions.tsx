import _ from 'lodash'
import cs from 'classnames'
import React from 'react'
import { observer } from 'mobx-react'

import events from '../lib/events'
import SessionsModel from './sessions-model'
import Collapsible from '../collapsible/collapsible'

export interface SessionProps {
  model: SessionsModel
}

export interface SessionsProps {
  model: Record<string, SessionsModel>
}

const Sessions = observer(({ model }: SessionsProps) => (
  <div
    className={cs('runnable-agents-region', {
      'no-agents': !_.size(model),
    })}
  >

    <div className='instruments-container sessions-container'>
      <ul className='hooks-container'>
        <li className='hook-item'>
          <Collapsible
            header={<>
                  Sessions <i style={{ textTransform: 'none' }}>({_.size(model)})</i>
            </>
            }
            headerClass='hook-header'
            headerExtras={
              <div className="clear-sessions"
                onClick={() => events.emit('clear:session')}
              ><span><i className="fas fa-ban" />Clear All Sessions</span></div>}
            contentClass='instrument-content'
          >
            <div>
              {_.map(model, (sess) => {
                return (<div key={sess.name}>{sess.name}</div>)
              })}
            </div>
          </Collapsible>
        </li>
      </ul>
    </div>
  </div>
))

export default Sessions
