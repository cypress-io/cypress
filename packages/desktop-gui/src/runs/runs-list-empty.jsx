import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Tooltip from '@cypress/react-tooltip'

import ipc from '../lib/ipc'
import projectsApi from '../projects/projects-api'
import { configFileFormatted } from '../lib/config-file-formatted'

@observer
class RunsListEmpty extends Component {
    state = {
      recordKey: null,
    }

    componentDidMount () {
      this._getRecordKeys()
    }

    componentDidUpdate () {
      this._getRecordKeys()
    }

    _getRecordKeys () {
      if (!this.state.recordKey) {
        projectsApi.getRecordKeys().then((keys = []) => {
          if (keys.length) {
            this.setState({ recordKey: keys[0].id })
          }
        })
      }
    }

    _openProjectIdGuide = (e) => {
      e.preventDefault()
      ipc.externalOpen('https://on.cypress.io/what-is-a-project-id')
    }

    _openCiGuide = (e) => {
      e.preventDefault()
      ipc.externalOpen('https://on.cypress.io/guides/continuous-integration')
    }

    _openRunGuide = (e) => {
      e.preventDefault()
      ipc.externalOpen('https://on.cypress.io/recording-project-runs')
    }

  _openRuns = (e) => {
    e.preventDefault()
    ipc.externalOpen(`https://on.cypress.io/dashboard/projects/${this.props.project.id}/runs`)
  }

  render () {
    const recordCommand = `cypress run --record --key ${this.state.recordKey || '<record-key>'}`

    return (
      <div>
        <div className='first-run-instructions'>
          <h4>
            To record your first run...
          </h4>
          <h5>
            <span>
              1. <code>projectId: {this.props.project.id}</code> has been saved to your {configFileFormatted(this.props.project.configFile)}.{' '}
              Make sure to check this file into source control.
            </span>
            <a onClick={this._openProjectIdGuide}>
              <i className='fas fa-question-circle' />{' '}
              Why?
            </a>
          </h5>
          <h5>
            <span>
              2. Run this command now, or in CI.
            </span>
            <a onClick={this._openCiGuide}>
              <i className='fas fa-question-circle' />{' '}
              Need help?
            </a>
          </h5>
          <pre id="code-record-command" className="copy-to-clipboard">
            <a className="action-copy" onClick={() => ipc.setClipboardText(recordCommand)}>
              <Tooltip
                title='Copy to clipboard'
                placement='top'
                className='cy-tooltip'
              >
                <i className='fas fa-clipboard' />
              </Tooltip>
            </a>
            <code>{recordCommand}</code>
          </pre>
          <hr />
          <p className='alert alert-default'>
            <i className='fas fa-info-circle' />{' '}
            Recorded runs will show up{' '}
            <a href='#' onClick={this._openRunGuide}>here</a>{' '}
            and on your{' '}
            <a href='#' onClick={this._openRuns}>Cypress Dashboard Service</a>.
          </p>
        </div>
      </div>
    )
  }
}

export default RunsListEmpty
