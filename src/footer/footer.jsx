import React, { Component } from 'react'

import App from '../lib/app'
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
    return App.ipc('external:open', 'https://on.cypress.io/changelog')
  }
}

