import _ from 'lodash'
import React from 'react'

import Agents from './agents'
import Hooks from './hooks'
import Routes from './routes'
import Collapsible from '../collapsible/collapsible'

const NoCommands = () => (
  <ul className='hooks-container'>
    <li className='no-commands'>
      No commands were issued in this test.
    </li>
  </ul>
)

const hasCommands = (hooks) => !!_.flatMap(hooks, 'commands').length

const TestHeader = ({ model }) => (
  <span>
    <i className='runnable-state fa'></i>
    <span className='runnable-title'>{model.title}</span>
    <div className='runnable-controls'>
      <i className='fa fa-warning' title='One or more commands failed'></i>
    </div>
  </span>
)

const Test = ({ model }) => (
  <div className='runnable-wrapper' style={{ paddingLeft: model.indent }}>
    <Collapsible
      header={<TestHeader model={model} />}
      headerClass='runnable-content-region'
      contentClass='runnable-instruments'
      isOpen={model.state === 'failed'}
    >
      <Agents model={model} />
      <Routes model={model} />
      <div className='runnable-commands-region'>
        {hasCommands(model.hooks) ? <Hooks model={model} /> : <NoCommands />}
      </div>
    </Collapsible>
    <pre className='test-error'>{model.error}</pre>
  </div>
)

export default Test
