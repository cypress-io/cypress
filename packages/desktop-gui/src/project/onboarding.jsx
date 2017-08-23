import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

import ipc from '../lib/ipc'

@observer
class OnBoading extends Component {
  constructor (props) {
    super(props)

    if (this.props.project.isNew) {
      this.props.project.openModal()
    }
  }

  render () {
    const { project } = this.props

    let closeModal = () => {
      project.closeModal()
      ipc.onboardingClosed()
    }

    return (
      <BootstrapModal
        show={project.onBoardingModalOpen}
        onHide={closeModal}
        backdrop='static'
      >
        <div className='modal-body'>
          <div className='empty-onboarding'>
            <h1>To help you get started...</h1>
            <p>
              We've added some folders and example tests to your project. Try running the
              <strong onClick={this._openExampleSpec.bind(this)}>
                <i className='fa fa-file-code-o'></i>{' '}
                {project.integrationExampleName}{' '}
              </strong>
              tests or add your own test file to
              <strong onClick={this._openIntegrationFolder.bind(this)}>
                <i className='fa fa-folder-o'></i>{' '}
                cypress/integration
              </strong>.
            </p>
            <div className='folder-preview-onboarding'>
              <ul>
                <li>
                  <span>
                    <i className='fa fa-folder-open-o'></i>{' '}
                    {project.name}
                  </span>
                  <ul>
                    <li className='app-code'>
                      <span >
                        <i className='fa fa-folder-o'></i>{' '}
                        ...
                      </span>
                    </li>
                    {this._scaffoldedFiles(project.scaffoldedFiles, 'new-code')}
                  </ul>
                </li>
              </ul>
            </div>
            <div className='helper-line'>
              <BootstrapModal.Dismiss className='btn btn-success'>
                OK, got it!
              </BootstrapModal.Dismiss>
            </div>
          </div>
        </div>
      </BootstrapModal>
    )
  }

  _scaffoldedFiles (files, className) {
    return _.map(_.sortBy(files, 'name'), (file) => {
      if (file.children) {
        return (
          <li className={className} key={file.name}>
            <span>
              <i className='fa fa-folder-open-o'></i>{' '}
              {file.name}
            </span>
            <ul>
              {this._scaffoldedFiles(file.children)}
            </ul>
          </li>
        )
      } else {
        return (
          <li className={className} key={file.name}>
            <span>
              <i className='fa fa-file-code-o'></i>{' '}
              {file.name}
            </span>
          </li>
        )
      }
    })
  }

  _openExampleSpec () {
    ipc.openFinder(this.props.project.integrationExampleFile)
  }

  _openIntegrationFolder () {
    ipc.openFinder(this.props.project.integrationFolder)
  }
}

export default OnBoading
