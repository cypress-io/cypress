import { observer } from 'mobx-react'
import React from 'react'
import Tooltip from '../tooltip/tooltip'

import events from '../lib/events'
import { indent } from '../lib/util'
import runnablesStore from '../runnables/runnables-store'

import Hooks from '../hooks/hooks'
import Agents from '../agents/agents'
import Routes from '../routes/routes'
import Collapsible from '../collapsible/collapsible'
import FlashOnClick from '../lib/flash-on-click'

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
      <Tooltip placement='left' align={{ offset: [0, 0] }} title='One or more commands failed'>
        <i className='fa fa-warning'></i>
      </Tooltip>
    </div>
  </span>
))

const Test = observer(({ model }) => (
  <div className='runnable-wrapper' style={{ paddingLeft: indent(model.level) }}>
    <Collapsible
      header={<TestHeader model={model} />}
      headerClass='runnable-content-region'
      contentClass='runnable-instruments'
      isOpen={model.state === 'failed' || model.isLongRunning || runnablesStore.hasSingleTest}
    >
      <Agents model={model} />
      <Routes model={model} />
      <div className='runnable-commands-region'>
        {model.commands.length ? <Hooks model={model} /> : <NoCommands />}
      </div>
    </Collapsible>
    <FlashOnClick
      message='Printed output to your console!'
      onClick={() => events.emit('show:error', model.id)}
    >
      <pre className='test-error'>{model.err.displayMessage}</pre>
    </FlashOnClick>
  </div>
))

export default Test
