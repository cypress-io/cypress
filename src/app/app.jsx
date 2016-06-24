import React, { Component } from 'react'

import events from '../lib/events'

import Header from '../header/header'
import Runnables from '../runnables/runnables'

import f from '../__fixtures__'

export default class extends Component {
  componentWillMount () {
    events.listen(this.props.runner)
  }

  render () {
    return (
      <div className='reporter'>
        <Header />
        <Runnables {...f.tests} />
      </div>
    )
  }
}
