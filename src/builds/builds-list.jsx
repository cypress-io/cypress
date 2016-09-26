import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import App from '../lib/app'
import state from '../lib/state'
import buildsCollection from './builds-collection'
import { getBuilds } from './builds-api'

import Build from './builds-list-item'
import LoginMessage from './login-message'
import PermissionMessage from './permission-message'

@observer
class Builds extends Component {

  componentWillMount () {
    getBuilds()
  }

  render () {
    if (!state.hasUser) return <LoginMessage />


    // TODO: if (noProjectId) return <SetupInCi/>

    if (buildsCollection.isLoading) return <Loader color="#888" scale={0.5}/>

    if (buildsCollection.error && (buildsCollection.error.statusCode === 401)) return <PermissionMessage />

    if (!buildsCollection.builds.length) return this._empty()

    return (
      <div id='builds'>
        <div className='builds-wrapper'>
          <h5>Builds</h5>
        </div>
        <ul className='builds-list list-as-table'>
          { _.map(buildsCollection.builds, (build) => (
            <li key={build.uuid} className='li'>
              <Build build={build} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  _empty () {
    return (
      <div id='builds-list-page'>
        <div className="empty">
          <h4>
            Run your first build in CI
          </h4>
          <p>Porta Amet Euismod Dolor <strong><i className='fa fa-plus'></i> Euismod</strong> Tellus Vehicula Vestibulum Venenatis Euismod.</p>
          <p>Adipiscing Nibh Magna Ridiculus Inceptos.</p>
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

  _error () {
    return (
      <div id='builds-list-page'>
        <div className="empty">
          <h4>
            You don't have permission to view the builds
          </h4>
          <p>Porta Amet Euismod Dolor <strong><i className='fa fa-plus'></i> Euismod</strong> Tellus Vehicula Vestibulum Venenatis Euismod.</p>
          <p>Adipiscing Nibh Magna Ridiculus Inceptos.</p>
          <button
            className='btn btn-default'
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

export default Builds
