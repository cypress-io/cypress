import React, { Component, useState } from 'react'
import { observer } from 'mobx-react'
import { usePopper } from 'react-popper'

import LoginForm from '../auth/login-form'
import { DashboardBranchHistory, CircleCI, GitHubActions, Bitbucket, GitLab, AWSCodeBuild } from './prompt-images'
import ipc from '../lib/ipc'

const Prompt = observer(({ children, isOpen, referenceElement }) => {
  const [popperElement, setPopperElement] = useState(null)
  const [arrowElement, setArrowElement] = useState(null)

  const { styles: popperStyles, attributes: popperAttributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom',
    strategy: 'fixed',
    modifiers: [{
      name: 'arrow',
      options: {
        element: arrowElement,
      },
    }, {
      name: 'offset',
      options: {
        offset: [-100, 0],
      },
    }],
  })

  if (!isOpen) return null

  return (
    <div className='popper prompt' ref={setPopperElement} style={popperStyles.popper} {...popperAttributes.popper}>
      {children}
      <div className='arrow' ref={setArrowElement} style={popperStyles.arrow} />
    </div>
  )
})

@observer
class CIPrompt1 extends Component {
  slug = 'ci1'
  utm_medium = 'CI Prompt 1'

  ciProviders = [
    {
      name: 'Circle CI',
      icon: CircleCI,
      link: {
        url: 'https://on.cypress.io/setup-ci-circleci',
        params: {
          utm_medium: this.utm_medium,
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
          utm_medium: this.utm_medium,
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
          utm_medium: this.utm_medium,
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
          utm_medium: this.utm_medium,
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
          utm_medium: this.utm_medium,
          utm_campaign: 'AWS',
        },
      },
    },
  ]

  _close = () => {
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
        utm_medium: this.utm_medium,
        utm_campaign: 'Other',
      },
    })
  }

  _viewMore = () => {
    ipc.externalOpen({
      url: 'https://on.cypress.io/ci',
      params: {
        utm_medium: this.utm_medium,
        utm_campaign: 'Learn More',
      },
    })
  }

  render () {
    const { prompts, referenceElement } = this.props

    return (
      <Prompt
        isOpen={prompts[this.slug]}
        referenceElement={referenceElement}
      >
        <div className='prompt-body'>
          <button className='btn btn-link close' onClick={this._close}>
            <i className='fas fa-times' />
          </button>
          <div className='text-content'>
            <h2>Optimize Cypress in CI</h2>
            <p>We've created these guides to help you maximize how you're running tests in CI.</p>
          </div>
          <div className='ci-providers'>
            { this.ciProviders.map((provider) => {
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
            <button className='btn btn-link' onClick={this._closeModal}>
              Close
            </button>
          </div>
        </div>
      </Prompt>
    )
  }
}

@observer
class DashboardPrompt1 extends Component {
  slug = 'dashboard1'
  utm_medium = 'Dashboard Prompt 1'

  _close = () => {
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
    const { prompts, referenceElement } = this.props

    return (
      <Prompt
        isOpen={prompts[this.slug]}
        referenceElement={referenceElement}
      >
        <div className='prompt-body'>
          <button className='btn btn-link close' onClick={this._close}>
            <i className='fas fa-times' />
          </button>
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
            <button className='btn btn-link' onClick={this._closeModal}>
              No Thanks
            </button>
          </div>
        </div>
      </Prompt>
    )
  }
}

const Prompts = observer(({ project, referenceElement }) => {
  const { prompts } = project

  return (
    <>
      <CIPrompt1 prompts={prompts} referenceElement={referenceElement} />
      <DashboardPrompt1 prompts={prompts} referenceElement={referenceElement} />
    </>
  )
})

export default Prompts
