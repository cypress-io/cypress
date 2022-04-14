import _ from 'lodash'
import cs from 'classnames'
import React from 'react'
import { observer } from 'mobx-react'

import events, { Events } from '../lib/events'
import SessionsModel from './sessions-model'
import Collapsible from '../collapsible/collapsible'
import FlashOnClick from '../lib/flash-on-click'

export interface SessionsProps {
  model: Record<string, SessionsModel>
  events: Events
}

@observer
class Sessions extends React.Component<SessionsProps> {
  static defaultProps = {
    events,
  }

  printToConsole = (name) => {
    const logId = this.props.model[name].id

    this.props.events.emit('show:command', logId)
  }

  render () {
    const model = this.props.model

    return (
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
                  ><span><i className="fas fa-ban" /> Clear All Sessions</span></div>}
                contentClass='instrument-content'
              >
                <div>
                  {_.map(model, (sess) => {
                    return (<FlashOnClick
                      key={sess.name}
                      message='Printed output to your console'
                      onClick={() => this.printToConsole(sess.name)}
                      shouldShowMessage={() => true}
                    ><div className="session-item" >{sess.name}</div></FlashOnClick>)
                  })}
                </div>
              </Collapsible>
            </li>
          </ul>
        </div>
      </div>
    )
  }
}

export default Sessions
