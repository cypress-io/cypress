import cs from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

import ipc from '../lib/ipc'

@observer
class OnBoarding extends Component {
  componentDidMount () {
    this._maybeShowModal()
  }

  componentDidUpdate () {
    this._maybeShowModal()
  }

  _maybeShowModal () {
    if (!this.showedModal && this.props.project.isNew) {
      this.showedModal = true
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
              We've added an example test file to your project. Try running{' '}
              <strong>example.spec.js</strong>{' '}
              or add your own test files to
              <strong onClick={this._openIntegrationFolder}>
                <i className='far fa-folder' />{' '}
                cypress/integration
              </strong>.
            </p>
            <div className='folder-preview-onboarding'>
              <ul>
                <li>
                  <span>
                    <i className='far fa-folder-open' />{' '}
                    {project.name}
                  </span>
                  <ul>
                    <li className='app-code'>
                      <span >
                        <i className='far fa-folder' />{' '}
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
    files = _.sortBy(files, 'name')

    const notFolders = _.every(files, (file) => !file.children)

    if (notFolders && files.length > 3) {
      const numHidden = files.length - 2

      files = files.slice(0, 2).concat({ name: `... ${numHidden} more files ...`, more: true })
    }

    return _.map(files, (file) => {
      if (file.children) {
        return (
          <li className={cs(className, 'new-item')} key={file.name}>
            <span>
              <i className='far fa-folder-open' />{' '}
              {file.name}
            </span>
            <ul>
              {this._scaffoldedFiles(file.children)}
            </ul>
          </li>
        )
      }

      return (
        <li className={cs(className, 'new-item', { 'is-more': file.more })} key={file.name}>
          <span>
            <i className='far fa-file-code' />{' '}
            {file.name}
          </span>
        </li>
      )
    })
  }

  _openIntegrationFolder = () => {
    ipc.openFinder(this.props.project.integrationFolder)
  }
}

export default OnBoarding
