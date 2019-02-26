import React, { Component } from 'react'

import ipc from '../lib/ipc'
import appStore from '../lib/app-store'

export default class Footer extends Component {
  render () {
    return (
      <footer className='footer'>
        <div className='container-fluid'>
          <p className='text-center'>
            Version {appStore.displayVersion} |{' '}
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
