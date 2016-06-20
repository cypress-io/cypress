import React, { Component } from 'react'
import Header from '../header/header'
import Runnables from '../runnables/runnables'

import f from '../__fixtures__'

export default class extends Component {
  render () {
    return (
      <div>
        <Header {...f.header} />
        <Runnables {...f.tests} />
      </div>
    )
  }
}
