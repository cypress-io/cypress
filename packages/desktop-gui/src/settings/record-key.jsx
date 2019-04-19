import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import ipc from '../lib/ipc'
import authStore from '../auth/auth-store'
import projectsApi from '../projects/projects-api'

const openDashboardProject = (project) => (e) => {
  e.preventDefault()
  ipc.externalOpen(`https://on.cypress.io/dashboard/projects/${project.id}`)
}

const openDashboardProjectSettings = (project) => (e) => {
  e.preventDefault()
  ipc.externalOpen(`https://on.cypress.io/dashboard/projects/${project.id}/settings`)
}

const openRecordKeyGuide = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/what-is-a-record-key')
}

const showLogin = () => {
  authStore.setShowingLogin(true)
}

@observer
class RecordKey extends Component {
  @observable key = null
  @observable isLoading = false

  componentDidMount () {
    this.wasAuthenticated = authStore.isAuthenticated
    this._loadKeys()
  }

  componentDidUpdate () {
    // try to load keys again if not already loading, not already loading,
    // and if user went from not authenticated to authenticated
    if (
      !this.isLoading &&
      !this.key &&
      (!this.wasAuthenticated && authStore.isAuthenticated)
    ) {
      this._loadKeys()
    }

    this.wasAuthenticated = authStore.isAuthenticated
  }

  _loadKeys () {
    this._setLoading(true)

    projectsApi.getRecordKeys().then((keys = []) => {
      this._setKey(keys[0])
      this._setLoading(false)
    })
  }

  @action _setLoading (isLoading) {
    this.isLoading = isLoading
  }

  @action _setKey (key) {
    if (key) this.key = key
  }

  render () {
    const { project } = this.props

    if (!project.isSetupForRecording) return null

    return (
      <div>
        <a href='#' className='learn-more' onClick={openRecordKeyGuide}>
          <i className='fa fa-info-circle'></i>{' '}
          Learn More
        </a>
        <p className='text-muted'>
          A Record Key sends your failing tests, screenshots, and videos to your{' '}
          <a href='#' onClick={openDashboardProject(project)}>
            Dashboard.
          </a>
        </p>
        {this._key()}
      </div>
    )
  }

  _key () {
    if (!authStore.isAuthenticated) {
      return (
        <p className='empty-well'>
          You must be logged in to view the record key.<br />
          <button
            className='btn btn-primary'
            onClick={showLogin}
          >
            <i className='fa fa-user'></i>{' '}
            Log In
          </button>
        </p>
      )
    }

    if (this.isLoading) {
      return (
        <p className='loading-record-keys'>
          <i className='fa fa-spinner fa-pulse'></i>{' '}
          Loading Keys...
        </p>
      )
    }

    if (!this.key) {
      return (
        <p className='empty-well'>
          This project has no record keys. <a href='#' onClick={openDashboardProjectSettings(this.props.project)}>Create one</a> on your Dashboard.
        </p>
      )
    }

    return (
      <div>
        <p className='text-muted'>
          To record, run this command:
        </p>
        <p>
          <pre><code>cypress run --record --key {this.key.id}</code></pre>
        </p>
        <p className='text-muted manage-btn'>
          <a href='#' onClick={openDashboardProjectSettings(this.props.project)}>
            <i className='fa fa-key'></i> You can change this key in the Dashboard
          </a>
        </p>
      </div>
    )
  }
}

export default RecordKey
