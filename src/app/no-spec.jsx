import React, { Component } from 'react'
import RunnerWrap from './runner-wrap'

class NoSpec extends Component {
  componentWillMount () {
    window.addEventListener('hashchange', this._onHashChange)
  }

  render () {
    return (
      <RunnerWrap className='no-spec'>
        <h1>No spec specified</h1>
        <p>Check the desktop app!</p>
      </RunnerWrap>
    )
  }

  _onHashChange = () => {
    this.props.onHashChange()
  }

  componentWillUnmount () {
    window.removeEventListener('hashchange', this._onHashChange)
  }
}

export default NoSpec
