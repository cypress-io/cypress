import React, { Component } from 'react'
import { observer } from 'mobx-react'

import App from '../lib/app'

@observer
class PermissionMessage extends Component {
  render () {
    return (
      <div id='builds-list-page'>
        <div className="empty">
          <h4>
            You don't have permission to view the builds
          </h4>
          <p>Porta Amet Euismod Dolor <strong><i className='fa fa-plus'></i> Euismod</strong> Tellus Vehicula Vestibulum Venenatis Euismod.</p>
          <p>Adipiscing Nibh Magna Ridiculus Inceptos.</p>
          <button
            className='btn btn-primary'
            onClick='/login'
            >
            <i className='fa fa-wrench'></i>{' '}
            Setup Project for CI
          </button>
          <p className='helper-docs-append'>
            <a onClick={this._openHelp} className='helper-docs-link'>
              <i className='fa fa-question-circle'></i>{' '}
              Need help?
            </a>
          </p>
        </div>
      </div>
    )
  }

  _openHelp () {
    App.ipc('external:open', 'https://on.cypress.io/guides/installing-and-running/#section-adding-projects')
  }
}

export default PermissionMessage
