import React, { Component } from 'react'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

import { CircleCI, GitHubActions, Bitbucket, GitLab, AWSCodeBuild } from './prompt-icons'
import ipc from '../lib/ipc'

const ciProviders = [
  {
    name: 'Circle CI',
    icon: CircleCI,
    link: {
      url: 'https://on.cypress.io/setup-ci-circleci',
      params: {
        utm_medium: 'CI Prompt 1',
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
        utm_medium: 'CI Prompt 1',
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
        utm_medium: 'CI Prompt 1',
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
        utm_medium: 'CI Prompt 1',
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

  render () {
    const { project } = this.props

    return (
      <BootstrapModal
        className="modal-right ci-prompt"
        show={project.ciPromptOpen}
        onHide={this._closeModal}
      >
        <div className='modal-body'>
          <BootstrapModal.Dismiss className='btn btn-link close'><i className="fas fa-times" /></BootstrapModal.Dismiss>
          <div className='header-content'>
            <h2>Optimize Cypress in CI</h2>
            <h4>We've created these guides to help you maximize how you're running tests in CI.</h4>
          </div>
          <div className='ci-providers'>
            { ciProviders.map((provider) => {
              const { name, icon: Icon, link } = provider

              return (
                <button className='ci-provider-button' onClick={() => this._openProviderLink(link)} key={name}>
                  <span>{name}</span>
                  <Icon width={22} height={22} />
                </button>
              )
            }) }

            <button className='btn btn-link see-other-guides'>
              <span>See other guides</span> <i className='fas fa-arrow-right' />
            </button>
          </div>
          <div className='modal-buttons'>
            <BootstrapModal.Dismiss className='btn btn-success'>
            Got it!
            </BootstrapModal.Dismiss>
          </div>
        </div>
      </BootstrapModal>
    )
  }
}

const Prompts = ({ project }) => (
  <>
    <CIPrompt project={project} />
  </>
)

export default Prompts
