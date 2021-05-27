import React, { Component } from 'react'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

import LoginForm from '../auth/login-form'
import { DashboardBranchHistory, CircleCI, GitHubActions, Bitbucket, GitLab, AWSCodeBuild } from './prompt-images'
import ipc from '../lib/ipc'

const ci1_utm_medium = 'CI Prompt 1'

const ciProviders = [
  {
    name: 'Circle CI',
    icon: CircleCI,
    link: {
      url: 'https://on.cypress.io/setup-ci-circleci',
      params: {
        utm_medium: ci1_utm_medium,
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
        utm_medium: ci1_utm_medium,
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
        utm_medium: ci1_utm_medium,
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
        utm_medium: ci1_utm_medium,
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
        utm_medium: ci1_utm_medium,
        utm_campaign: 'AWS',
      },
    },
  },
]

@observer
class CIPrompt1 extends Component {
  slug = 'ci1'

  _closeModal = () => {
    this.props.prompts.closePrompt(this.slug)
    ipc.setPromptShown(this.slug)
  }

  _openProviderLink = (link) => {
    ipc.externalOpen(link)
  }

  _seeOther = () => {
    ipc.externalOpen({
      url: 'https://on.cypress.io/setup-ci',
      params: {
        utm_medium: ci1_utm_medium,
        utm_campaign: 'Other',
      },
    })
  }

  _viewMore = () => {
    ipc.externalOpen({
      url: 'https://on.cypress.io/ci',
      params: {
        utm_medium: ci1_utm_medium,
        utm_campaign: 'Learn More',
      },
    })
  }

  render () {
    const { prompts } = this.props

    return (
      <BootstrapModal
        className='prompt'
        show={prompts[this.slug]}
        onHide={this._closeModal}
      >
        <div className='modal-body'>
          <BootstrapModal.Dismiss className='btn btn-link close'><i className='fas fa-times' /></BootstrapModal.Dismiss>
          <div className='text-content'>
            <h2>Optimize Cypress in CI</h2>
            <p>We've created these guides to help you maximize how you're running tests in CI.</p>
          </div>
          <div className='ci-providers'>
            { ciProviders.map((provider) => {
              const { name, icon: Icon, link } = provider

              return (
                <button className='ci-provider-button' onClick={() => this._openProviderLink(link)} key={name}>
                  <Icon width={18} height={18} />
                  <span>{name}</span>
                </button>
              )
            }) }
            <button className='btn btn-link see-other-guides' onClick={this._seeOther}>
              <span>See other guides</span> <i className='fas fa-arrow-right' />
            </button>
          </div>
          <div className='prompt-buttons'>
            <button className='btn btn-success' onClick={this._viewMore}>Learn More</button>
            <br />
            <BootstrapModal.Dismiss className='btn btn-link'>
              Close
            </BootstrapModal.Dismiss>
          </div>
        </div>
      </BootstrapModal>
    )
  }
}

@observer
class DashboardPrompt1 extends Component {
  slug = 'dashboard1'
  utm_medium = 'Dashboard Prompt 1'

  _closeModal = () => {
    this.props.prompts.closePrompt(this.slug)
    ipc.setPromptShown(this.slug)
  }

  _openAnalytics = (e) => {
    e.preventDefault()
    ipc.externalOpen({
      url: 'https://on.cypress.io/analytics',
      params: {
        utm_medium: this.utm_medium,
        utm_campaign: 'Analytics',
      },
    })
  }

  _openFlakyTests = (e) => {
    e.preventDefault()
    ipc.externalOpen({
      url: 'https://on.cypress.io/flake-management',
      params: {
        utm_medium: this.utm_medium,
        utm_campaign: 'Flaky Tests',
      },
    })
  }

  _openDebug = (e) => {
    e.preventDefault()
    ipc.externalOpen({
      url: 'https://on.cypress.io/test-failures',
      params: {
        utm_medium: this.utm_medium,
        utm_campaign: 'Debug',
      },
    })
  }

  render () {
    const { prompts } = this.props

    return (
      <BootstrapModal
        className='prompt'
        show={prompts[this.slug]}
        onHide={this._closeModal}
      >
        <div className='modal-body'>
          <BootstrapModal.Dismiss className='btn btn-link close'><i className='fas fa-times' /></BootstrapModal.Dismiss>
          <div className='text-content'>
            <h2>Debug Tests in CI Faster</h2>
            <p>With the <span className='text-bold'>Cypress Dashboard</span> you can:</p>
            <ul>
              <li>See <a onClick={this._openAnalytics}>test performance</a> over time</li>
              <li>Identify <a onClick={this._openFlakyTests}>flaky tests</a></li>
              <li>Never <a onClick={this._openDebug}>debug a failed test</a> in the terminal again</li>
            </ul>
          </div>
          <div className='dashboard-frame'>
            <div className='frame-title'>Previous Runs</div>
            <div className='svg-wrapper'>
              <DashboardBranchHistory height='100%' width='100%' />
            </div>
          </div>
          <div className='prompt-buttons'>
            <LoginForm
              utm='Dashboard Prompt 1'
              buttonClassName='btn btn-success'
              buttonContent='Get Started'
            />
            <BootstrapModal.Dismiss className='btn btn-link'>
              No Thanks
            </BootstrapModal.Dismiss>
          </div>
        </div>
      </BootstrapModal>
    )
  }
}

const Prompts = observer(({ project }) => {
  const { prompts } = project

  return (
    <>
      <CIPrompt1 prompts={prompts} />
      <DashboardPrompt1 prompts={prompts} />
    </>
  )
})

export default Prompts
