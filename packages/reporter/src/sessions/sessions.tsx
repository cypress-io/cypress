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

    {_.map(model, (sess) => {
      return (<div key={sess.name} className='instruments-container sessions-container'>
        <ul className='hooks-container'>
          <li className='hook-item'>
            <Collapsible
              header={<>
                  Session <i style={{ textTransform: 'none' }}>({sess.name})</i>
                &nbsp;
                {sess.state === 'pending' && <i className="fa fa-spinner fa-spin" />}

              </>
              }
              headerClass='hook-header'
              headerExtras={<div className="clear-sessions"
                onClick={() => events.emit('clear:session')}
              ><span>Clear Sessions</span></div>}
              contentClass='instrument-content'
            >
              <table>
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th># Cookies</th>
                    <th># LocalStorage keys</th>
                  </tr>
                </thead>
                <tbody>
                  {renderSessionTableContents(sess.data)}
                </tbody>
              </table>
            </Collapsible>
          </li>
        </ul>
      </div>)
    })}
  </div>
))

function renderSessionTableContents (data:any) {
  if (!_.size(data)) {
    return (<tr>
      <td colSpan={3}><i>no session data</i></td>
    </tr>)
  }

  return _.map(data, (val, domain) => (<tr key={domain}>
    <td>{domain}</td>
    <td>{val.cookies || '-'}</td>
    <td>{val.localStorage || '-'}</td>
  </tr>))
}

export default Sessions
