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

@observer
class RecordKey extends Component {
  @observable key = null
  @observable isLoading = false

  componentDidMount () {
    this._loadKeys()
  }

  componentDidUpdate () {
    this._loadKeys()
  }

  _loadKeys () {
    // don't load key if already loading, already loaded, or if
    // we can't show can anyway
    if (
      this.isLoading ||
      this.key ||
      !this.props.project.isSetupForRecording ||
      !authStore.isAuthenticated
    ) return

    this._setLoading(true)

    console.log('get keys')
    projectsApi.getRecordKeys().then((keys = []) => {
      console.log('got keys', keys)
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

    if (!authStore.isAuthenticated) {
      return this._loginMessage()
    }

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
        <p className='text-muted manage-btn'>
          <a href='#' onClick={openDashboardProjectSettings(project)}>
            <i className='fa fa-key'></i> You can change this key in the Dashboard
          </a>
        </p>
      </div>
    )
  }

  _key () {
    if (this.isLoadingKey) {
      return (
        <p className='loading-record-keys'>
          <i className='fa fa-spinner fa-spin'></i>{' '}
          Loading Keys...
        </p>
      )
    }

    if (!this.key) {
      return (
        <p className='empty'>This project has no record keys. <a href='#' onClick={openDashboardProjectSettings(this.props.project)}>Create one</a> on your Dashboard.</p>
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
      </div>
    )
  }
}

export default RecordKey
