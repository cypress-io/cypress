import React, { Component } from 'react'
import Header from '../header/header'
import Tests from '../tests/tests'

import f from '../__fixtures__'

export default class extends Component {
  render () {
    return (
      <div>
        <Header {...f.header} />
        <Tests {...f.tests} />
      </div>
    )
  }
}
