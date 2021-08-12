import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Tooltip from '@cypress/react-tooltip'
import Loader from 'react-loader'

import ipc from '../lib/ipc'
import projectsApi from '../projects/projects-api'
import { configFileFormatted } from '../lib/config-file-formatted'

@observer
class RunsListEmpty extends Component {
  componentDidMount () {
    this._updateProjectStatus()
  }

  componentDidUpdate () {
    this._updateProjectStatus()
  }

  _updateProjectStatus = () => {
    const { project } = this.props

    if (!project.orgId) {
      projectsApi.updateProjectStatus(project)
    }
  }

  _openProjectIdGuide = (e, utm_medium = 'Empty Runs Tab') => {
    e.preventDefault()
    ipc.externalOpen({
      url: 'https://on.cypress.io/what-is-a-project-id',
      params: {
        utm_medium,
        utm_campaign: 'Run Guide',
      },
    })
  }

  _openRuns = (e) => {
    e.preventDefault()
    ipc.externalOpen(`https://on.cypress.io/dashboard/projects/${this.props.project.id}/runs`)
  }

  _openCiGuide = (e, utm_medium = 'Empty Runs Tab') => {
    e.preventDefault()
    ipc.externalOpen({
      url: 'https://on.cypress.io/ci',
      params: {
        utm_medium,
        utm_campaign: 'Run Guide',
      },
    })
  }

  _openRunGuide = (e, utm_medium = 'Empty Runs Tab') => {
    e.preventDefault()
    ipc.externalOpen({
      url: 'https://on.cypress.io/recording-project-runs',
      params: {
        utm_medium,
        utm_campaign: 'Run Guide',
      },
    })
  }

  _openSampleProject = (e) => {
    e.preventDefault()
    ipc.externalOpen({
      url: 'https://on.cypress.io/rwa-dashboard',
      params: {
        utm_medium: 'Empty Runs Tab',
        utm_camptain: 'Sample Project',
      },
    })
  }

  _recordCommand = () => {
    return `cypress run --record --key ${this.props.recordKey || '<record-key>'}`
  }

  _control = () => {
    return (
      <div>
        <div className='first-run-instructions'>
          <h4 className='center'>
            To record your first run...
          </h4>
          <h5>
            <span>
              1. <code>projectId: {this.props.project.id}</code> has been saved to your {configFileFormatted(this.props.project.configFile)}.{' '}
              Make sure to check this file into source control.
            </span>
            <a onClick={(e) => this._openProjectIdGuide(e, 'Control Empty Runs Tab')}>
              <i className='fas fa-question-circle' />{' '}
              Why?
            </a>
          </h5>
          <h5>
            <span>
              2. Run this command now, or in CI.
            </span>
            <a onClick={(e) => this._openCiGuide(e, 'Control Empty Runs Tab')}>
              <i className='fas fa-question-circle' />{' '}
              Need help?
            </a>
          </h5>
          <pre id="code-record-command" className="copy-to-clipboard">
            <a className="action-copy" onClick={() => ipc.setClipboardText(this._recordCommand())}>
              <Tooltip
                title='Copy to clipboard'
                placement='top'
                className='cy-tooltip'
              >
                <i className='fas fa-clipboard' />
              </Tooltip>
            </a>
            <code>{this._recordCommand()}</code>
          </pre>
          <hr />
          <p className='alert alert-default'>
            <i className='fas fa-info-circle' />{' '}
            Recorded runs will show up{' '}
            <a href='#' onClick={(e) => this._openRunGuide(e, 'Control Empty Runs Tab')}>here</a>{' '}
            and on your{' '}
            <a href='#' onClick={this._openRuns}>Cypress Dashboard Service</a>.
          </p>
        </div>
      </div>
    )
  }

  _new = () => {
    return (
      <div>
        <div className='first-run-instructions new-first-run-instructions'>
          <h4>
            How to record your first run
          </h4>
          <p className='subtitle'>
            Recording test runs to the Dashboard enables you to run tests faster with parallelization and load balancing, debug failed tests in CI with screenshots and videos, and identify flaky tests.
          </p>
          <div className='step'>
            <span>
              1. <code>projectId: {this.props.project.id}</code> has been saved to your {configFileFormatted(this.props.project.configFile)}.{' '}
              Make sure to check this file into source control.
            </span>
            <span className='help-text'>
              <Tooltip
                className='tooltip-text-left cy-tooltip'
                title={<span>This helps Cypress uniquely identify your project. If altered or deleted, analytics and load balancing will not function properly. <a onClick={this._openProjectIdGuide}>Learn more</a></span>}
              >
                <a><i className='fas fa-question-circle' /></a>
              </Tooltip>
            </span>
          </div>
          <div className='step'>
            <span>
              2. Run this command now, or in CI.
            </span>
            <span className='help-text'>
              <Tooltip
                className='tooltip-text-left cy-tooltip'
                title={<span>Close this application and run this command with <code className='tooltip-code'>npx</code> or <code className='tooltip-code'>yarn</code> in your terminal. <a onClick={this._openRunGuide}>Learn more</a></span>}
              >
                <a><i className='fas fa-question-circle' /></a>
              </Tooltip>
            </span>
          </div>
          <pre id="code-record-command" className="copy-to-clipboard">
            <a className="action-copy" onClick={() => ipc.setClipboardText(this._recordCommand())}>
              <Tooltip
                title='Copy to clipboard'
                placement='top'
                className='cy-tooltip'
              >
                <i className='fas fa-clipboard' />
              </Tooltip>
            </a>
            <code>{this._recordCommand()}</code>
          </pre>
          <hr />
          <div className='panel-wrapper'>
            <div className='panel'>
              <div className='panel-icon panel-icon-small'>
                <i className='fas fa-infinity fa-fw' />
              </div>
              <div>
                <p>
                  <strong>Run in CI</strong>
                  <br />
                  Cypress was designed to be run in your CI, enabling parallel test runs and rich test analytics. <a onClick={this._openCiGuide}>Show me how</a>
                </p>
              </div>
            </div>
            <div className='panel'>
              <div className='panel-icon'>
                <i className='fas fa-tasks fa-fw' />
              </div>
              <div>
                <p>
                  <strong>Sample Project</strong>
                  <br />
                  Want to see what a recorded run looks like? See an example project in the Dashboard. <a onClick={this._openSampleProject}>See the sample</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render () {
    const { project } = this.props

    if (!project.orgId) {
      return <Loader color='#888' scale={0.5}/>
    }

    if (project.getTestGroup(2)) {
      return this._new()
    }

    return this._control()
  }
}

export default RunsListEmpty
