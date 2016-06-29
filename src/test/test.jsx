import { observer } from 'mobx-react'
import React from 'react'

import { indent } from '../lib/util'

import Agents from './agents'
import Hooks from './hooks'
import Routes from './routes'
import Collapsible from '../collapsible/collapsible'

const NoCommands = observer(() => (
  <ul className='hooks-container'>
    <li className='no-commands'>
      No commands were issued in this test.
    </li>
  </ul>
))

const TestHeader = observer(({ model }) => (
  <span>
    <i className='runnable-state fa'></i>
    <span className='runnable-title'>{model.title}</span>
    <div className='runnable-controls'>
      <i className='fa fa-warning' title='One or more commands failed'></i>
    </div>
  </span>
))

// TODO: only open collapsible if test has been active for, say, 500ms
const Test = observer(({ model }) => (
  <div className='runnable-wrapper' style={{ paddingLeft: indent(model.level) }}>
    <Collapsible
      header={<TestHeader model={model} />}
      headerClass='runnable-content-region'
      contentClass='runnable-instruments'
      isOpen={model.state === 'failed' || model.state === 'active'}
    >
      <Agents model={model} />
      <Routes model={model} />
      <div className='runnable-commands-region'>
        {model.commands.length ? <Hooks model={model} /> : <NoCommands />}
      </div>
    </Collapsible>
    <pre className='test-error'>{model.error}</pre>
  </div>
))

export default Test
