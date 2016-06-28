import { observer } from 'mobx-react'
import React, { Component } from 'react'

import events from '../lib/events'
import runnablesStore from '../runnables/runnables-store'

import Header from '../header/header'
import Runnables from '../runnables/runnables'

@observer
class App extends Component {
  componentWillMount () {
    events.listen(this.props.runner)
  }

  render () {
    return (
      <div className='reporter'>
        <Header />
        <Runnables runnables={runnablesStore.runnables} />
      </div>
    )
  }
}

export default App
