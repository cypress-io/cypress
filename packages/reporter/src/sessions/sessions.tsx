import _ from 'lodash'
import StatusIcon from '@cypress-design/react-statusicon'
import cs from 'classnames'
import React from 'react'
import { observer } from 'mobx-react'

import events, { Events } from '../lib/events'
import SessionsModel from './sessions-model'
import Collapsible from '../collapsible/collapsible'
import FlashOnClick from '../lib/flash-on-click'
import Tag from '../lib/tag'

export interface SessionsProps {
  model: Record<string, SessionsModel>
  events: Events
}

@observer
class Sessions extends React.Component<SessionsProps> {
  static defaultProps = {
    events,
  }

  printToConsole = (id) => {
    this.props.events.emit('show:command', id)
  }

  render () {
    const model = this.props.model

    return (
      <div className={cs('runnable-agents-region', { 'no-agents': !_.size(model) })}>
        <div className='instruments-container sessions-container'>
          <ul className='hooks-container'>
            <li className='hook-item'>
              <Collapsible
                isOpen
                header={<>Sessions <i style={{ textTransform: 'none' }}>({_.size(model)})</i></>}
                headerClass='hook-header'
                headerExtras={
                  <div
                    className="clear-sessions"
                    onClick={() => events.emit('clear:all:sessions')}
                  >
                    <span><i className="fas fa-ban" /> Clear All Sessions</span>
                  </div>
                }
                contentClass='instrument-content'
              >
                <div>
                  {_.map(model, (sess) => {
                    return (
                      <FlashOnClick
                        key={sess.name}
                        message='Printed output to your console'
                        onClick={() => this.printToConsole(sess.id)}
                        shouldShowMessage={() => true}
                      >
                        <div className="session-item" >
                          <span className={cs('session-info', { 'spec-session': !sess.isGlobalSession })}>
                            {sess.isGlobalSession && <StatusIcon status="placeholder" size="12" variant="simple" className='global-session' />}
                            {sess.name}
                          </span>
                          <span className='session-tag'>
                            <Tag
                              content={sess.status}
                              type={`${sess.state === 'failed' ? 'failed' : 'successful'}-status`}
                            />
                          </span>
                        </div>
                      </FlashOnClick>
                    )
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
