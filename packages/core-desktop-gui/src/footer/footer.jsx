import React, { Component } from 'react'

import ipc from '../lib/ipc'
import state from '../lib/state'

export default class Footer extends Component {

  render () {
    return (
      <footer className='footer'>
        <div className='container-fluid'>
          <p className='text-center'>
            Version { state.version } |{' '}
            <a onClick={this._openChangelog} href='#'>Changelog</a>
          </p>
        </div>
      </footer>
    )
  }

  _openChangelog (e) {
    e.preventDefault()
    return ipc.externalOpen('https://on.cypress.io/changelog')
  }
}
