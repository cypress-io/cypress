import React, { Component, useState } from 'react'
import { computed } from 'mobx'
import { observer } from 'mobx-react'
import { usePopper } from 'react-popper'

import { CircleCI, GitHubActions, Bitbucket, GitLab, AWSCodeBuild, CISingleIcon, CIMultiIcon } from './prompt-images'
import ipc from '../lib/ipc'

const Prompt = observer(({ children, isOpen, referenceElement, className }) => {
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
    <div className={`popper prompt ${className}`} ref={setPopperElement} style={popperStyles.popper} {...popperAttributes.popper}>
      {children}
      <div className='arrow' ref={setArrowElement} style={popperStyles.arrow} />
    </div>
  )
})

@observer
class CIPrompt1 extends Component {
  slug = 'ci1'
  utm_medium = 'CI Prompt 1'

  @computed get utm_content () {
    const { prompts } = this.props

    return prompts ? prompts.utm_content : undefined
  }

  @computed get ciProviders () {
    return [
      {
        name: 'Circle CI',
        icon: CircleCI,
        link: {
          url: 'https://on.cypress.io/setup-ci-circleci',
          params: {
            utm_medium: this.utm_medium,
            utm_campaign: 'Circle',
            utm_content: this.utm_content,
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
            utm_content: this.utm_content,
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
            utm_content: this.utm_content,
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
            utm_content: this.utm_content,
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
            utm_content: this.utm_content,
          },
        },
      },
    ]
  }

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
        utm_content: this.utm_content,
      },
    })
  }

  _viewMore = () => {
    ipc.externalOpen({
      url: 'https://on.cypress.io/ci',
      params: {
        utm_medium: this.utm_medium,
        utm_campaign: 'Learn More',
        utm_content: this.utm_content,
      },
    })
  }

  render () {
    const { prompts, referenceElement } = this.props

    return (
      <Prompt
        isOpen={prompts[this.slug]}
        referenceElement={referenceElement}
        className='prompt-ci1'
      >
        <div className='prompt-body'>
          <button className='btn btn-link close' onClick={this._close}>
            <i className='fas fa-times' />
          </button>
          <div className='text-content'>
            <h2>Set up CI</h2>
            <p>Optimize how you run tests in CI by following these guides.</p>
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
            <button className='btn btn-link' onClick={this._close}>
              Close
            </button>
          </div>
        </div>
      </Prompt>
    )
  }
}

@observer
class OrchestrationPrompt1 extends Component {
  slug = 'orchestration1'
  utm_medium = 'Orchestration Prompt 1'

  _close = () => {
    this.props.prompts.closePrompt(this.slug)
    ipc.setPromptShown(this.slug)
  }

  _openLearnMore = (e) => {
    e.preventDefault()
    ipc.externalOpen({
      url: 'https://on.cypress.io/smart-orchestration',
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
        className='prompt-orchestration1'
      >
        <div className='prompt-body'>
          <button className='btn btn-link close' onClick={this._close}>
            <i className='fas fa-times' />
          </button>
          <div className='text-content'>
            <h2>Run tests faster in CI</h2>
            <p>With <span className='text-bold'>Smart Orchestration</span> you can:</p>
            <ul>
              <li>Run spec files in parallel</li>
              <li>Prioritize failed specs to run first</li>
              <li>Cancel CI runs on test failure</li>
            </ul>
          </div>
          <div className='dashboard-frame'>
            <div className='frame-title'>CI Run Time</div>
            <div className='main-content-wrapper'>
              <div className='ci-run-time'>
                <div className='ci-icon'>
                  <CIMultiIcon height={20} width={20} />
                </div>
                <div className='ci-runtime'>
                  <div className='runtime-bar-wrapper'>
                    <div className='runtime-bar runtime-bar-short' />
                    <i className='fas fa-bolt' />
                  </div>
                  <span><span className='bold'>5 mins</span> with Parallelization</span>
                </div>
                <div className='ci-icon'>
                  <CISingleIcon height={20} width={20} />
                </div>
                <div className='ci-runtime'>
                  <div className='runtime-bar-wrapper'>
                    <div className='runtime-bar runtime-bar-long' />
                  </div>
                  <span><span className='bold'>12 mins</span> without Parallelization</span>
                </div>
              </div>
            </div>
          </div>
          <div className='prompt-buttons'>
            <button className='btn btn-success' onClick={this._openLearnMore}>
              Learn More
            </button>
            <br />
            <button className='btn btn-link' onClick={this._close}>
              Close
            </button>
          </div>
        </div>
      </Prompt>
    )
  }
}

const Prompts = observer(({ project, referenceElement }) => {
  if (!project || project.isLoading) return null

  const { prompts } = project

  return (
    <>
      <CIPrompt1 prompts={prompts} referenceElement={referenceElement} />
      <OrchestrationPrompt1 prompts={prompts} referenceElement={referenceElement} />
    </>
  )
})

export default Prompts
