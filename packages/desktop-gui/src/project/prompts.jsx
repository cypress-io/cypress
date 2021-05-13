import React, { Component } from 'react'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

import LoginForm from '../auth/login-form'
import { DashboardBranchHistory, CircleCI, GitHubActions, Bitbucket, GitLab, AWSCodeBuild } from './prompt-images'
import ipc from '../lib/ipc'

const ci_utm_medium = 'CI Prompt 1'

const ciProviders = [
  {
    name: 'Circle CI',
    icon: CircleCI,
    link: {
      url: 'https://on.cypress.io/setup-ci-circleci',
      params: {
        utm_medium: ci_utm_medium,
        utm_campaign: 'Circle',
      },
    },
  },
  {
    name: 'GitHub Actions',
    icon: GitHubActions,
    link: {
      url: 'https://on.cypress.io/github-actions',
      params: {
        utm_medium: 'CI Prompt 1',
        utm_campaign: 'GitHub',
      },
    },
  },
  {
    name: 'Bitbucket',
    icon: Bitbucket,
    link: {
      url: 'https://on.cypress.io/bitbucket-pipelines',
      params: {
        utm_medium: ci_utm_medium,
        utm_campaign: 'Bitbucket',
      },
    },
  },
  {
    name: 'GitLab CI/CD',
    icon: GitLab,
    link: {
      url: 'https://on.cypress.io/gitlab-ci',
      params: {
        utm_medium: ci_utm_medium,
        utm_campaign: 'GitLab',
      },
    },
  },
  {
    name: 'AWS CodeBuild',
    icon: AWSCodeBuild,
    link: {
      url: 'https://on.cypress.io/aws-codebuild',
      params: {
        utm_medium: ci_utm_medium,
        utm_campaign: 'AWS',
      },
    },
  },
]

@observer
class CIPrompt extends Component {
  _closeModal = () => {
    this.props.project.closeCiPrompt()
  }

  _openProviderLink = (link) => {
    ipc.externalOpen(link)
  }

  _seeOther = () => {
    ipc.externalOpen({
      url: 'https://on.cypress.io/setup-ci',
      params: {
        utm_medium: ci_utm_medium,
        utm_campaign: 'Other',
      },
    })
  }

  render () {
    const { project } = this.props

    return (
      <BootstrapModal
        className="modal-right prompt"
        show={project.ciPromptOpen}
        onHide={this._closeModal}
      >
        <div className='modal-body'>
          <BootstrapModal.Dismiss className='btn btn-link close'><i className="fas fa-times" /></BootstrapModal.Dismiss>
          <div className='text-content'>
            <h2>Optimize Cypress in CI</h2>
            <div className='info-box'>
              <i className='fas fa-graduation-cap' /> We've created these guides to help you maximize how you're running tests in CI.
            </div>
          </div>
          <div className='ci-providers'>
            { ciProviders.map((provider) => {
              const { name, icon: Icon, link } = provider

              return (
                <button className='ci-provider-button' onClick={() => this._openProviderLink(link)} key={name}>
                  <span>{name}</span>
                  <Icon width={20} height={20} />
                </button>
              )
            }) }
            <button className='btn btn-link see-other-guides' onClick={this._seeOther}>
              <span>See other guides</span> <i className='fas fa-arrow-right' />
            </button>
          </div>
          <div className='button-wrapper'>
            <BootstrapModal.Dismiss className='btn btn-link'>
              Close
            </BootstrapModal.Dismiss>
            <button className={'btn btn-success'}>Learn More</button>
          </div>
        </div>
      </BootstrapModal>
    )
  }
}

@observer
class DashboardPrompt extends Component {
  _closeModal = () => {
    this.props.project.closeDashboardPrompt()
  }

  _closeButton = () => (
    <BootstrapModal.Dismiss className='btn btn-link'>
      No Thanks
    </BootstrapModal.Dismiss>
  )

  render () {
    const { project } = this.props

    return (
      <BootstrapModal
        className="modal-right prompt dashboard-prompt"
        show={project.dashboardPromptOpen}
        onHide={this._closeModal}
      >
        <div className='modal-body'>
          <BootstrapModal.Dismiss className='btn btn-link close'><i className="fas fa-times" /></BootstrapModal.Dismiss>
          <div className='text-content'>
            <h2>Debug Tests Faster</h2>
            <div className='info-box'>
              <ul>
                <li>Run tests in parallel</li>
                <li>Identify flaky tests</li>
                <li>Never debug a failed test in the terminal again</li>
              </ul>
              <a href="#">Learn more</a>
            </div>
          </div>
          <div className='dashboard-frame'>
            <div className='frame-title'>Previous Runs</div>
            <div className='svg-wrapper'>
              <DashboardBranchHistory height='100%' width='100%' />
            </div>
          </div>
          <div className='text-content'>
            <p>Get started for free with the <span className="font-bold">Cypress Dashboard</span></p>
          </div>
          <LoginForm
            className='modal-buttons'
            prefix={this._closeButton()}
            buttonClassName='btn btn-success'
            buttonContent='Get Started'
          />
        </div>
      </BootstrapModal>
    )
  }
}

const Prompts = ({ project }) => (
  <>
    <CIPrompt project={project} />
    <DashboardPrompt project={project} />
  </>
)

export default Prompts
