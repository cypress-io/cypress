import React, { Component } from 'react'
import Header from '../header/header'

export default class extends Component {
  render () {
    const props = {}

    return (
      <div>
        <Header {...props} />
      </div>
    )
  }
}
