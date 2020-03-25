import React, { Component } from 'react'
import eventManager from '../lib/event-manager'

class NoSpec extends Component {
  componentDidMount () {
    window.addEventListener('hashchange', this._onHashChange)
  }

  render () {
    return (
      <div className='runner no-spec'>
        <div className='no-spec-message'>
          <p>Whoops, there is no test to run.</p>
          <p className='muted'>Choose a test to run from the desktop application.</p>
          <p>
            <button onClick={() => eventManager.focusTests()}>
              <i className='fas fa-chevron-left'></i>
              View All Tests
            </button>
          </p>
          <img src={require('../../static/no-spec-instructions.png')} />
        </div>
        {this.props.children}
      </div>
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
