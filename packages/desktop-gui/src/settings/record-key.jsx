import { observer } from 'mobx-react'
import React, { Component } from 'react'

import ipc from '../lib/ipc'
import projectsApi from '../projects/projects-api'

const openDashboardProject = (project) => (e) => {
  e.preventDefault()
  ipc.externalOpen(`https://on.cypress.io/dashboard/projects/${project.id}`)
}

const openRecordKeyGuide = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/what-is-a-record-key')
}

const openAdminKeys = (project) => (e) => {
  e.preventDefault()
  ipc.externalOpen(`https://on.cypress.io/dashboard/projects/${project.id}/settings`)
}

@observer
class RecordKey extends Component {
  state = {
    keys: [],
    isLoadingKeys: true,
  }

  componentWillMount () {
    projectsApi.getRecordKeys().then((keys = []) => {
      this.setState({
        keys,
        isLoadingKeys: false,
      })
    })
  }

  render () {
    const { project } = this.props

    if (!project.canShowRecordKey) return null

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
        {this._keys()}
        {this._loadingKeys()}
        <p className='text-muted manage-btn'>
          <a href='#' onClick={openAdminKeys(project)}>
            <i className='fa fa-key'></i> You can change this key in the Dashboard
          </a>
        </p>
      </div>
    )
  }

  _keys () {
    if (this.state.isLoadingKeys || !this.state.keys.length) return null

    return (
      <div>
        <p className='text-muted'>
          To record, run this command:
        </p>
        <p>
          <pre><code>cypress run --record --key {this.state.keys[0].id}</code></pre>
        </p>
      </div>
    )
  }

  _loadingKeys () {
    if (!this.state.isLoadingKeys) return null

    return (
      <p className='loading-record-keys'>
        <i className='fa fa-spinner fa-spin'></i>{' '}
        Loading Keys...
      </p>
    )
  }
}

export default RecordKey
