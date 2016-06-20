import _ from 'lodash'
import React from 'react'
import Tooltip from 'rc-tooltip'

import Agents from './agents'
import Hooks from './hooks'
import Routes from './routes'

const NoCommands = () => (
  <div className='no-commands'>
    No commands were issued in this test.
  </div>
)

const hasCommands = (hooks) => !!_.flatMap(hooks, 'commands').length

const Test = ({ model }) => (
  <div>
    <div className='runnable-wrapper' style={{ paddingLeft: model.indent }}>
      <div className='runnable-content-region'>
        <div>
          <div className='runnable-state'>
            <span className='test-state'>
              <i className='fa'></i>
            </span>
            <span className='test-title'>{model.title}</span>
          </div>
          <div className='runnable-controls'>
            <Tooltip placement='left' align={{ offset: [0, 0] }} overlay='One or more commands failed'>
              <i className='fa fa-warning'></i>
            </Tooltip>
          </div>
        </div>
      </div>
      <div className='runnable-instruments'>
        <Agents />
        <Routes />
        <div className='runnable-commands-region'>
          {hasCommands(model.hooks) ? <Hooks model={model} /> : <NoCommands />}
        </div>
      </div>
      <pre className='test-error'>{model.error}</pre>
    </div>
  </div>
)

export default Test
